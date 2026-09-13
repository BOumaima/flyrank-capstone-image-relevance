import fs from "node:fs/promises";
import path from "node:path";

import { analyzeImage } from "../llm/vision.js";
import { pool } from "../db/client.js";

const datasetPath = "dataset";

const categories = [
    "animals",
    "vehicles",
    "food",
    "nature",
];

async function saveImageMetadata(filename, metadata) {
    await pool.query(
        `
        INSERT INTO images (
            filename,
            subject,
            category,
            attributes,
            caption,
            confidence
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        `,
        [
            filename,
            metadata.subject,
            metadata.category,
            JSON.stringify(metadata.attributes),
            metadata.caption,
            metadata.confidence,
        ]
    );
}

async function processImages() {
    for (const category of categories) {
        const categoryPath = path.join(datasetPath, category);

        const files = await fs.readdir(categoryPath);

        for (const filename of files) {
            if (!filename.endsWith(".jpg")) {
                continue;
            }

            const imagePath = path.join(categoryPath, filename);

            console.log(`Processing: ${category}/${filename}`);

            try {
                const imageBuffer = await fs.readFile(imagePath);
                const imageBase64 = imageBuffer.toString("base64");

                const metadata = await analyzeImage(
                    imageBase64,
                    "image/jpeg"
                );

                await saveImageMetadata(filename, metadata);

                console.log(
                    `Saved: ${metadata.subject} (${metadata.confidence})`
                );
            } catch (error) {
                console.error(
                    `Failed: ${category}/${filename}`,
                    error.message
                );
            }
        }
    }

    await pool.end();

    console.log("Batch processing completed.");
}

processImages();