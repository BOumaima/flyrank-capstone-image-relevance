import { rankImagesForPost } from "./rankImages.js";
import { pool } from "../db/client.js";

const result = await rankImagesForPost(1);

console.log(`Post: ${result.post.title}`);

console.log("\nTop 10 images:");

for (const [index, image] of result.images
    .slice(0, 10)
    .entries()) {
    console.log(
        `${index + 1}. ${image.filename} - ${image.similarity.toFixed(4)}`
    );
}

await pool.end();