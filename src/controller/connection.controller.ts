import { asyncHandler } from "../utils/asyncHandler";
import { Request, Response } from "express";
import ApiError from "../utils/ApiError";
import ApiResponse from "../utils/ApiResponse";
import { CustomRequest } from "../types/customRequest";
import { FollowerModel } from "../models/follower.model";
import { isValidObjectId } from "mongoose";


export const followUser = asyncHandler(async (req: CustomRequest, res: Response) => {
  const userIdToFollow = req.params.userId;
  const currentUserId = req.user?._id;

  if (userIdToFollow == currentUserId) {
    throw new ApiError(400, "You cannot follow yourself.");
  }

  const result = await FollowerModel.create({
    followerId: currentUserId,
    followingId: userIdToFollow,
  });
  if (!result) {
    throw new ApiError(500, "Error while following user");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, result, "User followed successfully"));
});

export const unfollowUser = asyncHandler(
  async (req: CustomRequest, res: Response) => {
    const userIdToUnfollow = req.params.userId;
    const currentUserId = req.user?._id;

    const result = await FollowerModel.findOneAndDelete({
      followerId: currentUserId,
      followingId: userIdToUnfollow,
    });

    if (!result) {
      throw new ApiError(404, "Follow relationship not found");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, result, "User unfollowed successfully"));
  },
);

export const fetchFollowers = asyncHandler(
  async (req: Request, res: Response) => {
    const { userId } = req.query;
    if (!userId) {
      throw new ApiError(400, "User ID is required in query parameters.");
    }
    if (!isValidObjectId(userId)) {
      throw new ApiError(400, "Invalid user ID format.");
    }
    const followers = await FollowerModel.find({
      followingId: userId,
    })
      .populate("followerId", "userName fullName avatarImage")
      .lean();
    if (!followers && followers !== null) {
      throw new ApiError(500, "Error while fetching followers");
    }
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          followers,
          followers.length > 0
            ? "Followers fetched successfully"
            : "User has no followers",
        ),
      );
  },
);

export const fetchFollowing = asyncHandler(
  async (req: Request, res: Response) => {
    const { userId } = req.query;
    if (!userId) {
      throw new ApiError(400, "User ID is required in query parameters.");
    }
    if (!isValidObjectId(userId)) {
      throw new ApiError(400, "Invalid user ID format.");
    }
    const following = await FollowerModel.find({
      followerId: userId,
    })
      .populate("followingId", "userName fullName avatarImage")
      .lean();
    if (!following && following !== null) {
      throw new ApiError(500, "Error while fetching following");
    }
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          following,
          following.length > 0
            ? "Following fetched successfully"
            : "User is not following anyone",
        ),
      );
  },
);
