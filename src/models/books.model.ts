import mongoose from "mongoose";
import {IBook} from "../types/book";

const bookSchema = new mongoose.Schema<IBook>(
  {
    externalId: {
      type: String,
      required: true,
      unique: true,
    },
    isbn: {
      type: String,
    },
    title: {
      type: String,
      required: true,
    },
    subtitle: {
      type: String,
    },
    authors: {
      type: [String],
      required: true,
    },
    genres: {
      type: [String],
      required: true,
    },
    releaseDate: {
      type: Date,
    },
    description: {
      type: String,
    },
    pageCount: {
      type: Number,
    },
    averageRating: {
      type: Number,
    },
    languages: {
      type: [String],
      required: true,
    },
    coverImage: {
      type: String,
    },
    cover_i: {
      type: Number,
    },
  },
  {
    timestamps: true,
  },
);

bookSchema.index({ title: "text", authors: "text" });

export default mongoose.model<IBook>("Book", bookSchema);
