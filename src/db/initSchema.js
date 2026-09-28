import fs from "node:fs/promises";
import { pool } from "./client.js";

async function initSchema() {
    const schema = await fs.readFile(
        new URL("./schema.sql", import.meta.url),
        "utf8"
    );

    await pool.query(schema);

    console.log("Database schema initialized.");
    await pool.end();
}

initSchema().catch(async (error) => {
    console.error("Failed to initialize database schema:", error.message);
    await pool.end();
    process.exit(1);
});