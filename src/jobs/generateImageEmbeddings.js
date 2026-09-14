import { generateEmbedding } from "../llm/embedding.js";
import { saveImageEmbedding } from "../db/embeddings.js";
import { pool } from "../db/client.js";

async function generateImageEmbeddings() {
    const result = await pool.query(
        `
        SELECT
            i.id,
            i.filename,
            i.caption
        FROM images i
        LEFT JOIN image_embeddings e
            ON e.image_id = i.id
        WHERE e.image_id IS NULL
        ORDER BY i.id
        `
    );

    console.log(`Images needing embeddings: ${result.rows.length}`);

    for (const image of result.rows) {
        console.log(`Embedding: ${image.filename}`);

        try {
            const vector = await generateEmbedding(image.caption);

            await saveImageEmbedding({
                imageId: image.id,
                model: process.env.GEMINI_EMBEDDING_MODEL,
                vector,
            });

            console.log(
                `Saved: ${image.filename} (${vector.length} dimensions)`
            );
        } catch (error) {
            console.error(
                `Failed: ${image.filename}`,
                error.message
            );
        }
    }

    await pool.end();

    console.log("Image embedding job completed.");
}

generateImageEmbeddings();