import { Router } from "express";
import {
  getBookController,
  tbrBookController,
  removeTbrBookController,
  fetchReadingStatus,
  addReview,
  removeReview
} from "../controller/book.controller";
import { VerifyJWT } from "../middlewares/auth.middleware";

const router = Router();

// Ex for different roles like admin \ librarian \ moderators
//   router.route("/stats").get(
//     VerifyJWT, 
//     VerifyRole(["admin"]), 
//     getSystemStats
// );

// // Example: Allow multiple roles
// router.route("/manage-content").patch(
//     VerifyJWT,
//     VerifyRole(["admin", "moderator"]), 
//     manageContentController
// );


router.route("/getbook").post(getBookController);
router.route("/tbrbook").post(VerifyJWT, tbrBookController);
router.route("/remove-tbrbook").delete(VerifyJWT, removeTbrBookController);

router.route("/fetch-user-books").get(VerifyJWT, fetchReadingStatus);

router.route("/add-review").post(VerifyJWT, addReview);
router.route("/remove-review").delete(VerifyJWT, removeReview);

export default router;
