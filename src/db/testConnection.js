import { pool } from "./client.js";

try {
    const result = await pool.query("SELECT NOW()");

    console.log("Database connected:", result.rows[0]);

    await pool.end();
} catch (error) {
    console.error("Database connection failed:", error);
    process.exit(1);
}