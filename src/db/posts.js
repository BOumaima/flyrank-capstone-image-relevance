import { pool } from "./client.js";

export async function savePost({
    title,
    content,
    subject,
    category,
}) {
    const result = await pool.query(
        `
        INSERT INTO posts (
            title,
            content,
            subject,
            category
        )
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (title)
        DO UPDATE SET
            content = EXCLUDED.content,
            subject = EXCLUDED.subject,
            category = EXCLUDED.category
        RETURNING *
        `,
        [
            title,
            content,
            subject,
            category,
        ]
    );

    return result.rows[0];
}