import { pool } from "../db/client.js";
import { findMatchForPost } from "../matching/findMatch.js";
import { evalSet } from "./evalSet.js";

async function runEvaluation() {
    let correct = 0;

    console.log("Running evaluation...\n");

    for (const item of evalSet) {
        const result = await findMatchForPost(item.postId);

        const topImage = result.match;

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

        if (!topImage) {
            console.log(
                `  Status: ${result.status}`
            );

            for (const rejection of result.reasons.slice(0, 5)) {
                console.log(
                    `  ${rejection.filename}: ${rejection.reason}`
                );
            }
        }
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