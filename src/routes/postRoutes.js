import express from "express";
import { getPostImages } from "../controllers/postImagesController.js";

const router = express.Router();

router.get("/posts/:id/images", getPostImages);

export default router;