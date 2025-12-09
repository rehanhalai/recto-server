import { Router } from "express";
import { followUser, unfollowUser, fetchFollowers, fetchFollowing } from "../controller/connection.controller";
import { VerifyJWT } from "../middlewares/auth.middleware";

const router= Router();

router.route("/follow/:userId").post(VerifyJWT,followUser);
router.route("/unfollow/:userId").post(VerifyJWT,unfollowUser);
router.route("/followers").get(VerifyJWT,fetchFollowers);
router.route("/following").get(VerifyJWT,fetchFollowing);

export default router;