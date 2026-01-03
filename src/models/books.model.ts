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
      type: [String],
      default: [],
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
      type: [String]
    },
    releaseDate: {
      type: String,
    },
    description: {
      type: String,
    },
    averageRating: {
      type: Number,
      default: 0,
    },
    ratingsCount: {
      type: Number,
      default: 0,
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
    isStale: {
      type: Boolean,
      default: false,
    },
    alternativeIds: {
      type: [String], 
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

// OPTIMIZED INDEXES for fast queries
// Note: externalId has unique: true in schema, so no need to index here
bookSchema.index({ title: 1, authors: 1 }); // Compound index for title+author lookups
bookSchema.index({ alternativeIds: 1 }); // Alternative ID lookups
bookSchema.index({ enrichmentStatus: 1, updatedAt: -1 }); // Enrichment tracking
bookSchema.index({ updatedAt: -1 }); // Time-based queries

export default mongoose.model<IBook>("Book", bookSchema);
