import fs from "node:fs/promises";
import path from "node:path";
import { logLlmUsage } from "../db/usage.js";

import { analyzeImage } from "../llm/vision.js";
import { pool } from "../db/client.js";
import { IMAGE_REVIEW_THRESHOLD } from "../config/imageReview.js";

const datasetPath = "dataset";

const categories = [
    "animals",
    "vehicles",
    "food",
    "nature",
];

async function saveImageMetadata(filename, metadata, reviewStatus) {
    await pool.query(
        `
        INSERT INTO images (
            filename,
            subject,
            category,
            attributes,
            caption,
            confidence,
            review_status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (filename)
        DO UPDATE SET
            subject = EXCLUDED.subject,
            category = EXCLUDED.category,
            attributes = EXCLUDED.attributes,
            caption = EXCLUDED.caption,
            confidence = EXCLUDED.confidence,
            review_status = EXCLUDED.review_status
        `,
        [
            filename,
            metadata.subject,
            metadata.category,
            JSON.stringify(metadata.attributes),
            metadata.caption,
            metadata.confidence,
            reviewStatus,
        ]
    );
}

async function processImages() {
    for (const category of categories) {
        const categoryPath = path.join(datasetPath, category);

        const files = await fs.readdir(categoryPath);

        for (const filename of files) {
            if (!filename.endsWith(".jpg")) continue;

            const existingImage = await pool.query(
                `
                SELECT id
                FROM images
                WHERE filename = $1
                `,
                [filename]
            );

            if (existingImage.rows.length > 0) {
                console.log(`Skipping existing image: ${filename}`);
                continue;
            }

            const imagePath = path.join(categoryPath, filename);

            console.log(`Processing: ${category}/${filename}`);

            try {
                const imageBuffer = await fs.readFile(imagePath);
                const imageBase64 = imageBuffer.toString("base64");

                const { metadata, usage } = await analyzeImage(
                    imageBase64,
                    "image/jpeg"
                );

                const reviewStatus =
                    metadata.confidence >= IMAGE_REVIEW_THRESHOLD
                        ? "accepted"
                        : "needs_review";

                await saveImageMetadata(filename, metadata, reviewStatus);

                await logLlmUsage({
                    imageFilename: filename,
                    model: process.env.GEMINI_MODEL,
                    status: "success",
                    inputTokens: usage?.promptTokenCount ?? null,
                    outputTokens: usage?.candidatesTokenCount ?? null,
                    totalTokens: usage?.totalTokenCount ?? null,
                });

                console.log(
                    `Saved: ${metadata.subject} (${metadata.confidence})`
                );
            } catch (error) {
                console.error(
                    `Failed: ${category}/${filename}`,
                    error.message
                );

                await logLlmUsage({
                    imageFilename: filename,
                    model: process.env.GEMINI_MODEL,
                    status: "failed",
                });
            }
        }
    }

    await pool.end();

    console.log("Batch processing completed.");
}

processImages();