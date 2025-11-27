import { Schema, model } from "mongoose";
import { IReview } from "../types/bookReview";

const reviewSchema = new Schema<IReview>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    bookId: {
      type: Schema.Types.ObjectId,
      ref: "Book",
      required: true,
    },
    content: {
      type: String,
      trim: true, // Removes whitespace from start/end
      maxlength: 2000, // Good practice to limit review length
    },
    rating: {
      type: Number,
      required: true,
      min: 0,   // Minimum stars
      max: 5,   // Maximum stars (assuming a 5-star system)
    },
    likesCount: {
      type: Number,
      default: 0,
    },
    isSpoiler: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// --- INDEXES ---

// 1. Fetch reviews for a specific book, sorted by newest first
// Usage: db.reviews.find({ bookId: "..." }).sort({ createdAt: -1 })
reviewSchema.index({ bookId: 1, createdAt: -1 });

// 2. Ensure a user can only review a specific book ONCE    
// If they try to post again, it will throw a duplicate key error.
reviewSchema.index({ userId: 1, bookId: 1 }, { unique: true });

export const ReviewModel = model<IReview>("BookReview", reviewSchema);