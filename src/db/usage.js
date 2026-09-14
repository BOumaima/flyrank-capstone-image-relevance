import { pool } from "./client.js";

export async function logLlmUsage({
    imageFilename,
    model,
    status,
    inputTokens = null,
    outputTokens = null,
    totalTokens = null,
    estimatedCostUsd = 0,
}) {
    await pool.query(
        `
        INSERT INTO llm_usage (
            image_filename,
            model,
            status,
            input_tokens,
            output_tokens,
            total_tokens,
            estimated_cost_usd
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        `,
        [
            imageFilename,
            model,
            status,
            inputTokens,
            outputTokens,
            totalTokens,
            estimatedCostUsd,
        ]
    );
}