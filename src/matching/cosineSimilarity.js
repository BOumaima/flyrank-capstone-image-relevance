export function cosineSimilarity(vectorA, vectorB) {
    if (vectorA.length !== vectorB.length) {
        throw new Error("Vectors must have the same dimensions");
    }

    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;

    for (let i = 0; i < vectorA.length; i++) {
        dotProduct += vectorA[i] * vectorB[i];
        magnitudeA += vectorA[i] ** 2;
        magnitudeB += vectorB[i] ** 2;
    }

    if (magnitudeA === 0 || magnitudeB === 0) {
        throw new Error("Cannot compare zero vectors");
    }

    return (
        dotProduct /
        (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB))
    );
}