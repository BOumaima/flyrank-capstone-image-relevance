import {
    getImagesNeedingReview,
    updateImageReviewStatus,
} from "../db/images.js";

export async function getImagesForReview(req, res) {
    try {
        const images = await getImagesNeedingReview();

        res.json({
            count: images.length,
            images,
        });
    } catch (error) {
        console.error("Failed to get images for review:", error);

        res.status(500).json({
            error: "Failed to get images for review",
        });
    }
}

export async function reviewImage(req, res) {
    const imageId = Number(req.params.id);
    const { status } = req.body;

    if (!Number.isInteger(imageId)) {
        return res.status(400).json({
            error: "Image id must be an integer",
        });
    }

    if (!["accepted", "rejected"].includes(status)) {
        return res.status(400).json({
            error: "Status must be accepted or rejected",
        });
    }

    try {
        const image = await updateImageReviewStatus(
            imageId,
            status
        );

        if (!image) {
            return res.status(404).json({
                error: "Image not found",
            });
        }

        res.json({
            image,
        });
    } catch (error) {
        console.error("Failed to review image:", error);

        res.status(500).json({
            error: "Failed to review image",
        });
    }
}