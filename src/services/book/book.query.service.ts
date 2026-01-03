import axios from "axios";
import https from "https";
import Book from "../../models/books.model";
import { OpenLibraryFactory } from "../../utils/OpenLibraryDataCleaner";
import ApiError from "../../utils/ApiError";
import { IBook } from "../../types/book";

// Optimized HTTP client with connection pooling
const openLibClient = axios.create({
  baseURL: "https://openlibrary.org",
  httpAgent: new https.Agent({
    keepAlive: true,
    maxSockets: 50,        // Increased connection pool
    maxFreeSockets: 10,
    timeout: 60000,
    keepAliveMsecs: 30000,
  }),
  headers: {
    "User-Agent": "Recto 1.0 (recto.help@gmail.com)",
  },
  timeout: 3000,           // Reduced timeout for faster failures
});

class BookQueryService {
  /**
   * PRIMARY METHOD: Fast Book Resolution (OPTIMIZED)
   *
   * IMPROVEMENTS:
   * 1. Parallel DB lookups when possible
   * 2. Index-optimized queries
   * 3. Early returns to minimize work
   * 4. Lean queries for read-only operations
   * 5. Reduced timeout for faster failures
   *
   * TARGET: <100ms for cached hits, <300ms for cache misses
   */
  resolveBook = async (
    workId: string,
    title?: string,
    authors?: string[],
    otherInfo?: Record<string, any>,
  ): Promise<IBook> => {
    // --- STEP 1: Parallel Database Lookup (OPTIMIZED) ---
    // Run both queries in parallel if we have title and authors
    let book: IBook | null = null;

    if (title && authors) {
      // Execute both lookups simultaneously
      const [workIdResult, titleAuthorResult] = await Promise.all([
        this.findByWorkId(workId),
        this.findByTitleAndAuthors(title, authors),
      ]);

      book = workIdResult || titleAuthorResult;
    } else {
      // Only workId lookup if no fallback data
      book = await this.findByWorkId(workId);
    }

    // --- STEP 2: Early Return on Cache Hit ---
    if (book) {
      return book as IBook;
    }

    // --- STEP 3: Fetch Work Data (Only on Cache Miss) ---
    let workData;
    try {
      const response = await openLibClient.get(`/works/${workId}.json`);
      workData = response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new ApiError(404, "Book not found in Open Library");
      }
      if (error.code === "ECONNABORTED") {
        throw new ApiError(504, "OpenLibrary request timeout");
      }
      throw new ApiError(500, "Failed to fetch from Open Library");
    }

    // --- STEP 4: Normalize ---
    const normalized = OpenLibraryFactory.normalizeWorkData(workData, {
      title,
      authors,
      ...otherInfo,
    });

    // --- STEP 5: Save to DB (Non-blocking response possible) ---
    book = await Book.create(normalized);

    return book;
  };

  /**
   * Find existing book by workId (OPTIMIZED with lean)
   * Uses workId index for O(1) lookup
   */
  private findByWorkId = async (workId: string): Promise<IBook | null> => {
    return await Book.findOne({ workId })
      .select("-__v")              // Exclude version key
      .lean<IBook>()               // Return plain object (faster)
      .exec();
  };

  /**
   * Find by title + authors (OPTIMIZED)
   * Uses compound text index when possible
   */
  private findByTitleAndAuthors = async (
    title: string,
    authors: string[],
  ): Promise<IBook | null> => {
    // Try exact match first (uses index)
    let book = await Book.findOne({
      title: title,
      authors: { $all: authors },
    })
      .select("-__v")
      .lean<IBook>()
      .exec();

    // Fallback to case-insensitive if no exact match
    if (!book && title && authors.length > 0) {
      const titleRegex = new RegExp(`^${this.escapeRegex(title)}$`, "i");
      book = await Book.findOne({
        title: { $regex: titleRegex },
        authors: { $all: authors },
      })
        .select("-__v")
        .lean<IBook>()
        .exec();
    }

    return book;
  };

  /**
   * Escape regex special characters for safe regex queries
   */
  private escapeRegex = (str: string): string => {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  };
}

export const bookQueryService = new BookQueryService();
