import { pool } from "./client.js";

export async function getImagesNeedingReview() {
    const result = await pool.query(
        `
        SELECT
            id,
            filename,
            subject,
            category,
            attributes,
            caption,
            confidence,
            review_status,
            created_at
        FROM images
        WHERE review_status = 'needs_review'
        ORDER BY id
        `
    );

    return result.rows;
}

export async function updateImageReviewStatus(
    imageId,
    reviewStatus
) {
    const result = await pool.query(
        `
        UPDATE images
        SET review_status = $1
        WHERE id = $2
        RETURNING
            id,
            filename,
            subject,
            category,
            attributes,
            caption,
            confidence,
            review_status,
            created_at
        `,
        [reviewStatus, imageId]
    );

    return result.rows[0] ?? null;
}