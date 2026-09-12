import fs from "node:fs/promises";
import { analyzeImage } from "./vision.js";

const imagePath = "dataset/animals/red-fox.jpg";

const imageBuffer = await fs.readFile(imagePath);
const imageBase64 = imageBuffer.toString("base64");

const result = await analyzeImage(imageBase64, "image/jpeg");

console.log(result);