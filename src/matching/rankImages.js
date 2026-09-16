import { cosineSimilarity } from "./cosineSimilarity.js";
import { pool } from "../db/client.js";

export async function rankImagesForPost(postId) {
    const postResult = await pool.query(
        `
        SELECT
            p.id,
            p.title,
            e.vector
        FROM posts p
        JOIN post_embeddings e
            ON e.post_id = p.id
        WHERE p.id = $1
        `,
        [postId]
    );

    if (postResult.rows.length === 0) {
        throw new Error("Post embedding not found");
    }

    const post = postResult.rows[0];

    const imageResult = await pool.query(
        `
        SELECT
            i.id,
            i.filename,
            i.subject,
            i.category,
            i.caption,
            i.confidence,
            e.vector
        FROM images i
        JOIN image_embeddings e
            ON e.image_id = i.id
        `
    );

    const postVector = post.vector;

    const rankedImages = imageResult.rows
        .map((image) => {
            const imageVector = image.vector;

            const similarity = cosineSimilarity(
                postVector,
                imageVector
            );

            return {
                id: image.id,
                filename: image.filename,
                subject: image.subject,
                category: image.category,
                caption: image.caption,
                confidence: image.confidence,
                similarity,
            };
        })
        .sort((a, b) => b.similarity - a.similarity);

    return {
        post: {
            id: post.id,
            title: post.title,
        },
        images: rankedImages,
    };
}