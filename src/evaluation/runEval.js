import { pool } from "../db/client.js";
import { rankImagesForPost } from "../matching/rankImages.js";
import { evalSet } from "./evalSet.js";

async function runEvaluation() {
    let correct = 0;

    console.log("Running evaluation...\n");

    for (const item of evalSet) {
        const result = await rankImagesForPost(item.postId);

        const topImage = result.images[0];

        const isCorrect =
            topImage?.filename === item.expectedImage;

        if (isCorrect) {
            correct++;
        }

        console.log(
            `Post ${item.postId}: ` +
            `expected=${item.expectedImage}, ` +
            `top1=${topImage?.filename ?? "none"}, ` +
            `${isCorrect ? "CORRECT" : "WRONG"}`
        );
    }

    const precision = correct / evalSet.length;

    console.log("\nEvaluation complete.");
    console.log(`Correct: ${correct}/${evalSet.length}`);
    console.log(
        `Top-1 precision: ${(precision * 100).toFixed(2)}%`
    );

    await pool.end();
}

runEvaluation();