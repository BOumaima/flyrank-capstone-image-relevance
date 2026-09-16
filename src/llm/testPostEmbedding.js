import { generateEmbedding } from "./embedding.js";
import { pool } from "../db/client.js";

const result = await pool.query(
    `
    SELECT id, title, content
    FROM posts
    WHERE id = $1
    `,
    [40]
);

if (result.rows.length === 0) {
    throw new Error("Post not found");
}

const post = result.rows[0];

const text = `${post.title}. ${post.content}`;

const vector = await generateEmbedding(text);

await pool.query(
    `
    INSERT INTO post_embeddings (
        post_id,
        model,
        dimensions,
        vector
    )
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (post_id)
    DO UPDATE SET
        model = EXCLUDED.model,
        dimensions = EXCLUDED.dimensions,
        vector = EXCLUDED.vector
    `,
    [
        post.id,
        process.env.GEMINI_EMBEDDING_MODEL,
        vector.length,
        JSON.stringify(vector),
    ]
);

console.log("Post embedding saved.");
console.log("Post ID:", post.id);
console.log("Dimensions:", vector.length);

await pool.end();