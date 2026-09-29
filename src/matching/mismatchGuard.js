const DEFAULT_CONFIG = {
    minSimilarity: 0.24,
    minConfidence: 0.70,
};

function normalizeText(value) {
    return value.trim().toLowerCase();
}

function subjectMatches(expectedSubject, detectedSubject) {
    const expected = normalizeText(expectedSubject);
    const detected = normalizeText(detectedSubject);

    return (
        expected === detected ||
        detected.includes(expected)
    );
}

export function mismatchGuard({
    expectedSubject,
    expectedCategory,
    candidate,
    config = DEFAULT_CONFIG,
}) {
    const expectedCategoryNormalized = normalizeText(expectedCategory);

    const candidateCategoryNormalized = normalizeText(candidate.category);

    if (candidateCategoryNormalized !==expectedCategoryNormalized) {
        return {
            accepted: false,
            reason:
                `Category mismatch: expected ${expectedCategory}, ` +
                `detected ${candidate.category}`,
        };
    }

    if (!subjectMatches(expectedSubject,candidate.subject)) {
        return {
            accepted: false,
            reason:
                `Subject mismatch: expected ${expectedSubject}, ` +
                `detected ${candidate.subject}`,
        };
    }

    if (candidate.confidence < config.minConfidence) {
        return {
            accepted: false,
            reason:
                `Low confidence: ${candidate.confidence.toFixed(2)} ` +
                `is below ${config.minConfidence.toFixed(2)}`,
        };
    }

    if (candidate.similarity < config.minSimilarity) {
        return {
            accepted: false,
            reason:
                `Similarity too low: ${candidate.similarity.toFixed(4)} ` +
                `is below ${config.minSimilarity.toFixed(2)}`,
        };
    }

    return {
        accepted: true,
        reason: "Candidate passed the mismatch guard",
    };
}