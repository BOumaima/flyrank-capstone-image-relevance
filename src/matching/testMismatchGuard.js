import { mismatchGuard } from "./mismatchGuard.js";

const foxCandidate = {
    subject: "red fox",
    category: "animal",
    confidence: 0.94,
    similarity: 0.40,
};

const wolfCandidate = {
    subject: "wolf",
    category: "animal",
    confidence: 0.90,
    similarity: 0.2426,
};

const lowConfidenceCandidate = {
    subject: "red fox",
    category: "animal",
    confidence: 0.50,
    similarity: 0.40,
};

const wrongCategoryCandidate = {
    subject: "car",
    category: "vehicle",
    confidence: 0.95,
    similarity: 0.40,
};

console.log(
    "FOX:",
    mismatchGuard({
        expectedSubject: "red fox",
        expectedCategory: "animal",
        candidate: foxCandidate,
    })
);

console.log(
    "\nWOLF:",
    mismatchGuard({
        expectedSubject: "red fox",
        expectedCategory: "animal",
        candidate: wolfCandidate,
    })
);

console.log(
    "\nLOW CONFIDENCE:",
    mismatchGuard({
        expectedSubject: "red fox",
        expectedCategory: "animal",
        candidate: lowConfidenceCandidate,
    })
);

console.log(
    "\nWRONG CATEGORY:",
    mismatchGuard({
        expectedSubject: "red fox",
        expectedCategory: "animal",
        candidate: wrongCategoryCandidate,
    })
);