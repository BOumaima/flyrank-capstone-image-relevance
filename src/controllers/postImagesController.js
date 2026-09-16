import { findMatchForPost } from "../matching/findMatch.js";

export async function getPostImages(req, res) {
    const postId = Number(req.params.id);

    if (!Number.isInteger(postId)) {
        return res.status(400).json({
            error: "Invalid post id",
        });
    }

    try {
        const result = await findMatchForPost(postId);

        return res.json(result);
    } catch (error) {
        if (error.message === "Post not found") {
            return res.status(404).json({
                error: "Post not found",
            });
        }

        if (error.message === "Post embedding not found") {
            return res.status(422).json({
                error: "Post embedding not found",
            });
        }

        console.error(error);

        return res.status(500).json({
            error: "Failed to find image match",
        });
    }
}