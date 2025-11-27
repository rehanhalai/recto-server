import { Types } from "mongoose";
import { IUser } from "./user";
import { IBook } from "./book";

export interface IReview {
  _id: Types.ObjectId;
  userId: Types.ObjectId | IUser;
  bookId: Types.ObjectId | IBook;
  content?: string;        // Optional: User might just leave a star rating
  rating: number;          // Float (e.g., 4.5)
  likesCount: number;
  isSpoiler: boolean;
  createdAt: Date;
  updatedAt: Date;
}