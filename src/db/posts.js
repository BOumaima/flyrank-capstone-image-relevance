import { pool } from "./client.js";

export async function savePost({ title, content }) {
    const result = await pool.query(
        `
        INSERT INTO posts (title, content)
        VALUES ($1, $2)
        RETURNING *
        `,
        [title, content]
    );

    return result.rows[0];
}