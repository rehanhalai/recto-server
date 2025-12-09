import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import User from "../models/user.model";
import ApiError from "../utils/ApiError";
import ApiResponse from "../utils/ApiResponse";

export const searchUsers = asyncHandler(
  async (req: Request, res: Response) => {
    const { username } = req.query;

    if (typeof username !== "string" || !username.trim()) {
      throw new ApiError(400, "A valid username is required for search.");
    }

    const users = await User.find({
      userName: { $regex: username, $options: "i" },
    }).select("fullName userName avatarImage"); // Exclude sensitive fields

    if (!users.length) {
      return res
        .status(404)
        .json(new ApiResponse(404, [], "No users found matching the query."));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, users, "Users fetched successfully."));
  },
);

export const getUser = asyncHandler(async (req: Request, res: Response) => {
  const {username} = req.query;

  if (typeof username !== "string" || !username.trim()) {
    throw new ApiError(400, "A valid username is required.");
  }

  const user = await User.findOne({userName: username}).select("-email -googleId -isVerified");
  if (!user) {
    return res
      .status(404)
      .json(new ApiResponse(404, [], "No user found matching the query."));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User fetched successfully."));
}); 2