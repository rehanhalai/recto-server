import { Types } from "mongoose";
import { IUser } from "./user";

export interface IBlog {
  _id: Types.ObjectId;
  authorId: Types.ObjectId | IUser; // Renamed from userId to authorId for clarity (optional)
  title: string;
  subtitle?: string;
  content: string;         // Can hold HTML or Markdown
  coverImage?: string;     // URL to the image
  likesCount: number;
  commentsCount: number;
  createdAt: Date;
  updatedAt: Date;
}