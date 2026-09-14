import { retry } from "./retry.js";

let attempts = 0;

const result = await retry(
    async () => {
        attempts++;

        console.log(`Running attempt ${attempts}`);

        if (attempts < 3) {
            throw new Error("Temporary failure");
        }

        return "success";
    },
    {
        maxAttempts: 3,
        baseDelayMs: 500,
    }
);

console.log("Result:", result);