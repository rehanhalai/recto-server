import { Router } from "express";
import BookValidationSchema from "../validation/book.schema";
import bookReviewSchema from "../validation/bookReview.schema";
import validate from "../middlewares/validate.middleware";
import {
  getBookController,
  tbrBookController,
  removeTbrBookController,
  fetchBooksBasedOnStatus,
  getPurchaseLinksController,
  searchBooksController,
  searchBooksByAuthorController,
} from "../controller/book.controller";
import {
  addReview,
  removeReview,
  updateReview,
  getAllReviewsForBook,
} from "../controller/reviews.controller";
import { VerifyJWT } from "../middlewares/auth.middleware";
import { apiLimiter } from "../middlewares/rateLimiter.middleware";

const router = Router();

// for all users (without the JWT token)
router
  .route("/getbook")
  .post(apiLimiter, validate(BookValidationSchema.getBook), getBookController);

// Purchase links endpoint (public access)
router
  .route("/purchase-links/:bookId")
  .get(
    apiLimiter,
    validate(BookValidationSchema.getPurchaseLinks),
    getPurchaseLinksController,
  );

// Search books endpoint (public access)
router
  .route("/search")
  .get(
    apiLimiter,
    validate(BookValidationSchema.searchBooks),
    searchBooksController,
  );

// Search books by author endpoint (public access)
router
  .route("/search/author")
  .get(
    apiLimiter,
    validate(BookValidationSchema.searchBooksByAuthor),
    searchBooksByAuthorController,
  );

// Protected Routes
router.use(VerifyJWT);
router
  .route("/tbrbook")
  .post(validate(BookValidationSchema.tbrBook), tbrBookController);
router
  .route("/tbrbook/:tbrId")
  .delete(
    validate(BookValidationSchema.tbrRemoveBook),
    removeTbrBookController,
  );
router
  .route("/fetch-user-books")
  .get(
    validate(BookValidationSchema.fetchBooksBasedOnStatus),
    fetchBooksBasedOnStatus,
  );

// Review CRUD
router
  .route("/reviews/add")
  .post(validate(bookReviewSchema.addReview), addReview);
router
  .route("/reviews/:bookId")
  .get(validate(bookReviewSchema.getAllReviewsForBook), getAllReviewsForBook);
router
  .route("/reviews/:reviewId")
  .patch(validate(bookReviewSchema.updateReview), updateReview);
router
  .route("/reviews/:reviewId")
  .delete(validate(bookReviewSchema.removeReview), removeReview);

// router.route("/reviews/:reviewId/like").post();

export default router;
