import express from "express";
import { getPostImages } from "../controllers/postImagesController.js";
import { getImagesForReview, reviewImage } from "../controllers/imageReviewController.js";

const router = express.Router();

router.get("/posts/:id/images", getPostImages);

router.get("/images/review", getImagesForReview);

router.patch("/images/:id/review", reviewImage);

export default router;