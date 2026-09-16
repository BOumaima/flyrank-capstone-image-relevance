import { cosineSimilarity } from "./cosineSimilarity.js";

const vectorA = [1, 0, 0];
const vectorB = [1, 0, 0];
const vectorC = [0, 1, 0];

console.log(
    "Same direction:",
    cosineSimilarity(vectorA, vectorB)
);

console.log(
    "Different direction:",
    cosineSimilarity(vectorA, vectorC)
);