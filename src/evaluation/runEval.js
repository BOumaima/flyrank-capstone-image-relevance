import { pool } from "../db/client.js";
import { findMatchForPost } from "../matching/findMatch.js";
import { evalSet } from "./evalSet.js";

async function runEvaluation() {
    let correct = 0;
    let wrongMatch = 0;
    let noConfidentMatch = 0;

    console.log("Running evaluation...\n");

    for (const item of evalSet) {
        const result = await findMatchForPost(item.postId);

        if (result.status === "matched") {
            const isCorrect =result.match.filename === item.expectedImage;

            if (isCorrect) {
                correct++;
                console.log(`Post ${item.postId}: ` + `expected=${item.expectedImage}, ` + `top1=${result.match.filename}, ` + "CORRECT");
            } else {
                wrongMatch++;
                console.log(`Post ${item.postId}: ` + `expected=${item.expectedImage}, ` + `top1=${result.match.filename}, ` + "WRONG_MATCH");
            }
            continue;
        }
        noConfidentMatch++;

        console.log(`Post ${item.postId}: ` + `expected=${item.expectedImage}, ` + `top1=none, ` + "NO_CONFIDENT_MATCH");

        console.log(`Rejections: ${result.reasons.length}`);

        for (const rejection of result.reasons.slice(0, 5)) {
            console.log(`${rejection.filename}: ${rejection.reason}`);
        }
    }

    const precision = correct / evalSet.length;

    console.log("\nEvaluation complete.");
    console.log(`Correct matches: ${correct}/${evalSet.length}`);
    console.log(`Wrong matches: ${wrongMatch}`);
    console.log(`No confident match: ${noConfidentMatch}`);
    console.log(`Top-1 precision: ${(precision * 100).toFixed(2)}%`);

    await pool.end();
}

runEvaluation();