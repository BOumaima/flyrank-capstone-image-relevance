import { generateEmbedding } from "../llm/embedding.js";
import { pool } from "../db/client.js";
import { logLlmUsage } from "../db/usage.js";

async function savePostEmbedding({
    postId,
    model,
    vector,
}) {
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
            postId,
            model,
            vector.length,
            JSON.stringify(vector),
        ]
    );
}

async function generatePostEmbeddings() {
    const result = await pool.query(
        `
        SELECT
            p.id,
            p.title,
            p.content
        FROM posts p
        LEFT JOIN post_embeddings e
            ON e.post_id = p.id
        WHERE e.post_id IS NULL
        ORDER BY p.id
        `
    );

    console.log(
        `Posts needing embeddings: ${result.rows.length}`
    );

    for (const post of result.rows) {
        console.log(`Embedding: ${post.title}`);

        try {
            const text = `${post.title}. ${post.content}`;

            const { vector, usage } = await generateEmbedding(text);

            await savePostEmbedding({
                postId: post.id,
                model: process.env.GEMINI_EMBEDDING_MODEL,
                vector,
            });

            await logLlmUsage({
                operation: "embedding",
                model: process.env.GEMINI_EMBEDDING_MODEL,
                status: "success",
                inputTokens: usage?.promptTokenCount ?? null,
                outputTokens: usage?.candidatesTokenCount ?? null,
                totalTokens: usage?.totalTokenCount ?? null,
            });

            console.log(
                `Saved: ${post.title} (${vector.length} dimensions)`
            );
        } catch (error) {
            console.error(
                `Failed: ${post.title}`,
                error.message
            );

            await logLlmUsage({
                operation: "embedding",
                model: process.env.GEMINI_EMBEDDING_MODEL,
                status: "failed",
            });
        }
    }

    await pool.end();

    console.log("Post embedding job completed.");
}

generatePostEmbeddings();