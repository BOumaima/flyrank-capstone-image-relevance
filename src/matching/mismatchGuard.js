const DEFAULT_CONFIG = {
    minSimilarity: 0.30,
    minConfidence: 0.70,
};

export function mismatchGuard({
    expectedSubject,
    expectedCategory,
    candidate,
    config = DEFAULT_CONFIG,
}) {
    if (candidate.category !== expectedCategory) {
        return {
            accepted: false,
            reason:
                `Category mismatch: expected ${expectedCategory}, ` +
                `detected ${candidate.category}`,
        };
    }

    if (candidate.subject.toLowerCase() !== expectedSubject.toLowerCase()) {
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