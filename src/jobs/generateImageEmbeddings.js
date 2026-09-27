import { generateEmbedding } from "../llm/embedding.js";
import { saveImageEmbedding } from "../db/embeddings.js";
import { logLlmUsage } from "../db/usage.js";
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
            const { vector, usage } = await generateEmbedding(image.caption);

            await saveImageEmbedding({
                imageId: image.id,
                model: process.env.GEMINI_EMBEDDING_MODEL,
                vector,
            });

            await logLlmUsage({
                operation: "embedding",
                imageFilename: image.filename,
                model: process.env.GEMINI_EMBEDDING_MODEL,
                status: "success",
                inputTokens: usage?.promptTokenCount ?? null,
                outputTokens: usage?.candidatesTokenCount ?? null,
                totalTokens: usage?.totalTokenCount ?? null,
            });

            console.log(
                `Saved: ${image.filename} (${vector.length} dimensions)`
            );
        } catch (error) {
            console.error(
                `Failed: ${image.filename}`,
                error.message
            );

            await logLlmUsage({
                operation: "embedding",
                imageFilename: image.filename,
                model: process.env.GEMINI_EMBEDDING_MODEL,
                status: "failed",
            });
        }
    }

    await pool.end();

    console.log("Image embedding job completed.");
}

generateImageEmbeddings();