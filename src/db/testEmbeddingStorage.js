import { generateEmbedding } from "../llm/embedding.js";
import { saveImageEmbedding } from "./embeddings.js";
import { pool } from "./client.js";

const result = await pool.query(
    `
    SELECT id, caption
    FROM images
    WHERE filename = 'red-fox.jpg'
    LIMIT 1
    `
);

const image = result.rows[0];

if (!image) {
    throw new Error("red-fox.jpg not found in database");
}

const vector = await generateEmbedding(image.caption);

await saveImageEmbedding({
    imageId: image.id,
    model: process.env.GEMINI_EMBEDDING_MODEL,
    vector,
});

console.log("Embedding saved.");
console.log("Image ID:", image.id);
console.log("Dimensions:", vector.length);

await pool.end();