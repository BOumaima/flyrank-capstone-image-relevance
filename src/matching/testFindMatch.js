import { findMatchForPost } from "./findMatch.js";
import { pool } from "../db/client.js";

const result = await findMatchForPost(1);

console.log(JSON.stringify(result, null, 2));

await pool.end();