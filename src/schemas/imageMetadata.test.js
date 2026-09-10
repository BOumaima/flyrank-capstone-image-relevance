import { imageMetadataSchema } from "./imageMetadata.js";

const validMetadata = {
    subject: "red fox",
    category: "animal",
    attributes: ["orange fur", "wild", "forest"],
    caption: "A red fox standing in a forest",
    confidence: 0.94,
};

const invalidMetadata = {
    subject: "red fox",
    category: "animal",
    attributes: ["orange fur"],
    caption: "A red fox standing in a forest",
    confidence: 1.5,
};

const validResult = imageMetadataSchema.safeParse(validMetadata);

console.log("Valid metadata:", validResult.success);

const invalidResult = imageMetadataSchema.safeParse(invalidMetadata);

console.log("Invalid metadata:", invalidResult.success);