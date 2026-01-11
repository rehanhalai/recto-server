import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import https from "https";
import ApiError from "../utils/ApiError";

/**
 * Centralized OpenLibrary API Client
 *
 * Provides a unified interface for all OpenLibrary API interactions with:
 * - Connection pooling for performance
 * - Consistent error handling
 * - Request timeout management
 * - Proper User-Agent header
 */
class OpenLibraryClient {
  private client: AxiosInstance;
  private readonly BASE_URL = "https://openlibrary.org";
  private readonly DEFAULT_TIMEOUT = 10000; // 10 seconds

  constructor() {
    this.client = axios.create({
      baseURL: this.BASE_URL,
      httpsAgent: new https.Agent({
        keepAlive: true,
        maxSockets: 50, // Connection pool size
        maxFreeSockets: 10,
        timeout: 60000,
        keepAliveMsecs: 30000,
      }),
      headers: {
        "User-Agent": "Recto/1.0 (contact@recto.app)",
      },
      timeout: this.DEFAULT_TIMEOUT,
    });
  }

  /**
   * Fetches a work by its ID
   * @param workId - The OpenLibrary work ID (e.g., "OL45804W" or "/works/OL45804W")
   * @returns The work data from OpenLibrary
   */
  async getWork(workId: string): Promise<any> {
    try {
      // Normalize workId to ensure it starts with /works/
      const normalizedId = workId.startsWith("/works/")
        ? workId
        : `/works/${workId}`;

      const response = await this.client.get(`${normalizedId}.json`, {
        timeout: 3000, // Faster timeout for work lookups
      });

      return response.data;
    } catch (error) {
      return this.handleError(error, "Failed to fetch work");
    }
  }

  /**
   * Searches for books by title
   * @param title - The book title to search for
   * @param page - Page number (default: 1)
   * @param limit - Results per page (default: 10)
   * @param fields - Comma-separated list of fields to return
   * @returns Search results from OpenLibrary
   */
  async searchByTitle(
    title: string,
    page: number = 1,
    limit: number = 10,
    fields?: string,
  ): Promise<any> {
    try {
      const params: any = {
        title,
        page,
        limit,
      };

      if (fields) {
        params.fields = fields;
      }

      const response = await this.client.get("/search.json", {
        params,
      });

      return response.data;
    } catch (error) {
      return this.handleError(error, "Failed to search books by title");
    }
  }

  /**
   * Searches for books by author
   * @param author - The author name to search for
   * @param page - Page number (default: 1)
   * @param limit - Results per page (default: 10)
   * @param fields - Comma-separated list of fields to return
   * @returns Search results from OpenLibrary
   */
  async searchByAuthor(
    author: string,
    page: number = 1,
    limit: number = 10,
    fields?: string,
  ): Promise<any> {
    try {
      const params: any = {
        author,
        page,
        limit,
      };

      if (fields) {
        params.fields = fields;
      }

      const response = await this.client.get("/search.json", {
        params,
      });

      return response.data;
    } catch (error) {
      return this.handleError(error, "Failed to search books by author");
    }
  }

  /**
   * Generic search with custom parameters
   * @param params - Search parameters
   * @returns Search results from OpenLibrary
   */
  async search(params: Record<string, any>): Promise<any> {
    try {
      const response = await this.client.get("/search.json", {
        params,
      });

      return response.data;
    } catch (error) {
      return this.handleError(error, "Failed to search books");
    }
  }

  /**
   * Fetches an author by their ID
   * @param authorId - The OpenLibrary author ID (e.g., "OL23919A")
   * @returns The author data from OpenLibrary
   */
  async getAuthor(authorId: string): Promise<any> {
    try {
      // Normalize authorId to ensure it starts with /authors/
      const normalizedId = authorId.startsWith("/authors/")
        ? authorId
        : `/authors/${authorId}`;

      const response = await this.client.get(`${normalizedId}.json`);

      return response.data;
    } catch (error) {
      return this.handleError(error, "Failed to fetch author");
    }
  }

  /**
   * Fetches an edition by its ID
   * @param editionId - The OpenLibrary edition ID
   * @returns The edition data from OpenLibrary
   */
  async getEdition(editionId: string): Promise<any> {
    try {
      const normalizedId = editionId.startsWith("/books/")
        ? editionId
        : `/books/${editionId}`;

      const response = await this.client.get(`${normalizedId}.json`);

      return response.data;
    } catch (error) {
      return this.handleError(error, "Failed to fetch edition");
    }
  }

  /**
   * Makes a custom GET request to OpenLibrary API
   * @param endpoint - The API endpoint (e.g., "/works/OL45804W.json")
   * @param config - Additional axios config
   * @returns The response data
   */
  async get(endpoint: string, config?: AxiosRequestConfig): Promise<any> {
    try {
      const response = await this.client.get(endpoint, config);
      return response.data;
    } catch (error) {
      return this.handleError(error, `Failed to fetch ${endpoint}`);
    }
  }

  /**
   * Centralized error handling for OpenLibrary API calls
   */
  private handleError(error: any, defaultMessage: string): never {
    if (axios.isAxiosError(error)) {
      // Timeout error
      if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
        throw new ApiError(
          504,
          "OpenLibrary API request timed out. Please try again.",
        );
      }

      // Response error (4xx, 5xx)
      if (error.response) {
        const status = error.response.status;

        if (status === 404) {
          throw new ApiError(404, "Resource not found in OpenLibrary");
        }

        if (status >= 500) {
          throw new ApiError(
            503,
            "OpenLibrary API is currently unavailable. Please try again later.",
          );
        }

        throw new ApiError(
          status,
          `OpenLibrary API error: ${error.response.statusText}`,
        );
      }

      // Network error
      if (error.request) {
        throw new ApiError(503, "Unable to connect to OpenLibrary API");
      }
    }

    // Unknown error
    throw new ApiError(500, defaultMessage);
  }
}

// Export singleton instance
export const openLibraryClient = new OpenLibraryClient();

// Export class for testing purposes
export default OpenLibraryClient;
