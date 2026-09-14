import { logLlmUsage } from "./usage.js";
import { pool } from "./client.js";

await logLlmUsage({
    imageFilename: "test.jpg",
    model: "gemini-3.6-flash",
    status: "success",
    inputTokens: 100,
    outputTokens: 50,
    totalTokens: 150,
    estimatedCostUsd: 0,
});

console.log("Usage logged.");

await pool.end();