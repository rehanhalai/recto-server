import { asyncHandler } from "../utils/asyncHandler";
import { Request, Response } from "express";
import Book from "../models/books.model";
import axios from "axios";
import ApiError from "../utils/ApiError";
import ApiResponse from "../utils/ApiResponse";
import https from "https";
import { OpenLibraryFactory } from "../utils/OpenLibraryDataCleaner";
import { UserBookModel } from "../models/addedBook.model";
import { CustomRequest } from "../types/customRequest";
import mongoose from "mongoose";
import { ReviewModel } from "../models/bookReview.model";
// import { ReviewLikeModel } from "../models/reviewLike.model";

const openLibClient = axios.create({
  baseURL: "https://openlibrary.org",
  httpAgent: new https.Agent({ keepAlive: true }),
  headers: {
    "User-Agent": "Recto 1.0 (recto.help@gmail.com)",
    "Accept-Encoding": "gzip, deflate,compress",
  },
  timeout: 5000,
});

export const getBookController = asyncHandler(
  async (req: Request, res: Response) => {
    const { externalId, ...rest } = req.body;
    const title = req.body.title as string;
    const authors = Array.isArray(rest.authors)
      ? rest.authors[0]
      : rest.authors || "";

    if (!externalId) {
      return res.status(400).json({
        success: false,
        message: "Book ID is required",
      });
    }
    const existingBook = await Book.findOne({
      $or: [{ externalId }, { alternativeIds: externalId }],
    });

    if (existingBook)
      return res
        .status(200)
        .json(new ApiResponse(200, existingBook, "Book fetched successfully"));

    const apiPromise = openLibClient.get(`/works/${externalId}.json`);
    let duplicateCheckPromise: Promise<any> = Promise.resolve(null);

    if (title && authors) {
      const titleRegex = new RegExp(`^${title}$`, "i");

      duplicateCheckPromise = Book.findOne({
        title: { $regex: titleRegex },
        authors: { $regex: authors, $options: "i" },
      });
    }
    const [apiResponse, duplicateBook] = await Promise.all([
      apiPromise,
      duplicateCheckPromise,
    ]);

    if (apiResponse.status !== 200) {
      throw new ApiError(404, "Book not found in external source");
    }

    const newBook = OpenLibraryFactory.normalizeWorkData(
      apiResponse.data,
      rest,
    );

    if (duplicateBook) {
      let isUpdated = false;

      const newBookDesc = newBook.description || "";
      const currentBookDesc = duplicateBook.description || "";

      if (newBookDesc && newBookDesc.length > currentBookDesc.length) {
        duplicateBook.description = newBookDesc;
        isUpdated = true;
      }
      // B. Enrich Cover
      if (!duplicateBook.coverImage && newBook.coverImage) {
        duplicateBook.coverImage = newBook.coverImage;
        duplicateBook.cover_i = newBook.cover_i;
        isUpdated = true;
      }

      // C. Enrich Subtitle
      if (!duplicateBook.subtitle && newBook.subtitle) {
        duplicateBook.subtitle = newBook.subtitle;
        isUpdated = true;
      }

      // D. Enrich Release Date
      if (!duplicateBook.releaseDate && newBook.releaseDate) {
        duplicateBook.releaseDate = newBook.releaseDate;
        isUpdated = true;
      }

      // Always link the IDs so we find it faster next time
      if (!duplicateBook?.alternativeIds?.includes(externalId)) {
        duplicateBook?.alternativeIds?.push(externalId);
        isUpdated = true;
      }

      if (isUpdated) {
        await duplicateBook.save();
      }
      return res
        .status(200)
        .json(new ApiResponse(200, duplicateBook, "Book fetched successfully"));
    }

    if (newBook.externalId !== externalId) {
      newBook.alternativeIds = [externalId];
    }
    const createdBook = await Book.create(newBook);

    return res
      .status(200)
      .json(new ApiResponse(200, createdBook, "Book fetched successfully"));
  },
);

export const tbrBookController = asyncHandler(
  async (req: CustomRequest, res: Response) => {
    const userId = req.user?._id;
    const { bookId, status, startedAt, finishedAt } = req.body;

    if (!userId || !bookId || !status) {
      throw new ApiError(400, "userId, bookId and status are required");
    }

    const updates: any = { status };

    if (startedAt)
      updates.startedAt = startedAt ? new Date(startedAt) : null;

    if (status === "finished" && finishedAt) {
      updates.finishedAt = finishedAt ? new Date(finishedAt) : null;
    } else if (status !== "finished") {
      updates.finishedAt = null;
    }

    const addedBook = await UserBookModel.findOneAndUpdate(
      { userId, bookId },
      {
        $set: updates,
        $setOnInsert: { userId, bookId },
      },
      {
        new: true,
        upsert: true,
      },
    );

    return res
      .status(200)
      .json(
        new ApiResponse(200, addedBook, "Book added to TBR successfully"),
      );
  },
);

export const removeTbrBookController = asyncHandler(
  async (req: CustomRequest, res: Response) => {
    const userId = req.user?._id;
    const { _id } = req.body;

    if (!userId || !_id) {
      throw new ApiError(400, "userId and bookId are required");
    }

    const deltedData = await UserBookModel.findOneAndDelete({ _id, userId });
    if (!deltedData) {
      throw new ApiError(404, "Book not found in TBR");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, null, "Book removed from TBR successfully"));
  },
);

export const fetchReadingStatus = asyncHandler( async (req: CustomRequest, res: Response) => {
  const userId = req.user?._id;
  const {status} = req.query;

  if (!userId || !status) {
    throw new ApiError(400, "userId or status is required");
  }

  const userBooks = await UserBookModel.find({ userId, status: status }).populate('bookId','title authors coverImage externalId ');
  if(!userBooks || userBooks.length === 0) {
    throw new ApiError(404, "No books found for the given status");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, userBooks, "Books fetched successfully"));
});

export const addReview = asyncHandler( async (req:CustomRequest , res: Response) => {
  const userId = req.user?._id;
  const { bookId, content, rating } = req.body;
  
  if (!userId || !bookId || rating === undefined) {
    throw new ApiError(400, "userId, bookId, and rating are required");
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  try{
    const newReview = await ReviewModel.create([{
      userId,
      bookId,
      content,
      rating
    }], { session: session });


    const book = await Book.findById(bookId).session(session);
    if(!book){
      throw new ApiError(404, "Book not found");
    }

    const totalRating = (book.averageRating || 0) * (book.ratingsCount || 0);
    const newCount = (book.ratingsCount || 0) + 1;
    const newAverage = (totalRating + rating) / newCount;

    await Book.updateOne(
      { _id : book._id },
      {
        $set : {
          averageRating: newAverage.toFixed(1),
          ratingsCount: newCount
        }
      },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    return res
      .status(200)
      .json(new ApiResponse(200, newReview[0], "Review added successfully"));

  } catch(error : Error | any){
    await session.abortTransaction();
    session.endSession();

    if(error.code === 11000){
      throw new ApiError(400, "User has already reviewed this book");
    }
    
    throw new ApiError(500, "Internal Server Error");
  }
});

export const removeReview = asyncHandler( async (req:CustomRequest , res: Response) => {
  const userId = req.user?._id;
  const { reviewId } = req.body;

  if (!userId || !reviewId) {
    throw new ApiError(400, "userId and reviewId are required");
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const deletedReview = await ReviewModel.findOneAndDelete({ _id: reviewId, userId  }).session(session);
    if(!deletedReview){
      throw new ApiError(404, "Review not found or you are not authorized to delete this review");
    }

    const book = await Book.findById(deletedReview.bookId).session(session);
    if(!book){
      // This case is unlikely if data is consistent, but good to handle.
      // The review is already deleted, so we can just commit and report success.
      await session.commitTransaction();
      return res
        .status(200)
        .json(new ApiResponse(200, null, "Review removed successfully, but associated book was not found."));
    }

    const totalRating = (book.averageRating || 0) * (book.ratingsCount || 0);
    const newCount = (book.ratingsCount || 1) - 1;

    let newAverage = 0;
    if (newCount > 0) {
      newAverage = (totalRating - deletedReview.rating) / newCount;
    }

    await Book.updateOne(
      { _id: book._id },
      { $set: { averageRating: newAverage.toFixed(1), ratingsCount: newCount } },
      { session }
    );

    await session.commitTransaction();

    return res
      .status(200)
      .json(new ApiResponse(200, null, "Review removed successfully"));
  } catch (error) {
    await session.abortTransaction();
    throw error; // Re-throw the original error to be handled by asyncHandler
  } finally {
    session.endSession();
  }
});