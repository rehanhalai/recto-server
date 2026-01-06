import { Schema, model } from "mongoose";
import { IBlog } from "../types/blog";

const BlogSchema = new Schema<IBlog>(
  {
    authorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, // Indexes this field to quickly find "All blogs by User X"
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150, // Reasonable limit for a title
    },
    subtitle: {
      type: String,
      trim: true,
      maxlength: 250,
    },
    content: {
      type: String,
      required: true,
      maxlength: 10000,
    },
    coverImage: {
      type: String, // Stores the URL (e.g., from Cloudinary/S3)
    },
    likesCount: {
      type: Number,
      default: 0,
    },
    commentsCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true, // Automatically manages createdAt (Timestamp) and updatedAt
  },
);

// --- SEARCH INDEXES ---

// Allow searching by Title and Content
// Usage: db.blogs.find({ $text: { $search: "search term" } })
BlogSchema.index({ title: "text", content: "text" });

export const BlogModel = model<IBlog>("Blog", BlogSchema);
