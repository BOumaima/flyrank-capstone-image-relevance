import { pool } from "../db/client.js";
import { rankImagesForPost } from "./rankImages.js";
import { mismatchGuard } from "./mismatchGuard.js";

export async function findMatchForPost(postId) {
    const postResult = await pool.query(
        `
        SELECT
            id,
            title,
            subject,
            category
        FROM posts
        WHERE id = $1
        `,
        [postId]
    );

    if (postResult.rows.length === 0) {
        throw new Error("Post not found");
    }

    const post = postResult.rows[0];

    const ranking = await rankImagesForPost(postId);

    const rejections = [];

    for (const candidate of ranking.images) {
        const decision = mismatchGuard({
            expectedSubject: post.subject,
            expectedCategory: post.category,
            candidate,
        });

        if (decision.accepted) {
            return {
                status: "matched",
                post: {
                    id: post.id,
                    title: post.title,
                },
                match: {
                    ...candidate,
                    reason: decision.reason,
                },
            };
        }

        rejections.push({
            filename: candidate.filename,
            reason: decision.reason,
        });
    }

    return {
        status: "no_confident_match",
        post: {
            id: post.id,
            title: post.title,
        },
        match: null,
        reasons: rejections,
    };
}