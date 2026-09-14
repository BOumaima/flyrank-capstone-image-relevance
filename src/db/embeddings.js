import { pool } from "./client.js";

export async function saveImageEmbedding({
    imageId,
    model,
    vector,
}) {
    await pool.query(
        `
        INSERT INTO image_embeddings (
            image_id,
            model,
            dimensions,
            vector
        )
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (image_id)
        DO UPDATE SET
            model = EXCLUDED.model,
            dimensions = EXCLUDED.dimensions,
            vector = EXCLUDED.vector
        `,
        [
            imageId,
            model,
            vector.length,
            JSON.stringify(vector),
        ]
    );
}