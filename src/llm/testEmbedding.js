import { generateEmbedding } from "./embedding.js";

const text = "A red fox standing in a forest";

const embedding = await generateEmbedding(text);

console.log("Embedding generated.");
console.log("Dimensions:", embedding.length);
console.log("First 5 values:", embedding.slice(0, 5));