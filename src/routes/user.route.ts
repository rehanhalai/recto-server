import { Router } from "express";
import {
  changePassword,
  forgotPassword,
  googleAuthCallback,
  googleAuthRedirect,
  logout,
  newPassword,
  refreshAccessToken,
  signin,
  signup,
  updateAvatarAndBanner,
  updateEmail,
  updateProfile,
  userNameAvailability,
  verifyOTPforPasswordChange,
  VerifyOTPSaveUser,
  whoami,
} from "../controller/user.controller";
import { VerifyJWT } from "../middlewares/auth.middleware";
import { upload } from "../middlewares/multer.middleware";

const router = Router();

router.route("/signup").post(signup);
router.route("/signup-verify").post(VerifyOTPSaveUser);
router.route("/signin").post(signin);
router.route("/refresh-accesstoken").post(refreshAccessToken);

// The entry point. Frontend links <a href=".../google"> here for google auths
router.route("/google").get(googleAuthRedirect);
router.route("/google/callback").get(googleAuthCallback);

// for change to reset passwords
router.route("/password-otp").post(forgotPassword);
router.route("/password-otp-verify").post(verifyOTPforPasswordChange);
router.route("/new-password").post(newPassword);
router.route("/change-password").post(VerifyJWT, changePassword);

// secured routes
router.route("/logout").post(VerifyJWT, logout);

router.route("/update-profile").post(VerifyJWT, updateProfile);
router.route("/update-email").post(VerifyJWT, updateEmail);
router.route("/update-profileimage").post(
  VerifyJWT,
  upload.fields([
    {
      name: "avatarImage",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  updateAvatarAndBanner,
);

router.route("/check").get(userNameAvailability);

router.route("/whoami").get(VerifyJWT,whoami);

export default router;
