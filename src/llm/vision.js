import { GoogleGenAI, Type } from "@google/genai";
import { imageMetadataSchema } from "../schemas/imageMetadata.js";
import { retry } from "../utils/retry.js";
import { isRetryableError } from "../utils/retryableError.js";

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

export async function analyzeImage(imageBase64, mimeType) {
    const response = await retry(
        () =>
            ai.models.generateContent({
                model: process.env.GEMINI_MODEL,

                contents: [
                    {
                        inlineData: {
                            mimeType,
                            data: imageBase64,
                        },
                    },
                    {
                        text: `
                Analyze this image for an image relevance system.

                Rules:
                - subject: the main subject of the image
                - category: broad category such as animal, vehicle, food, or nature
                - attributes: useful visual characteristics
                - caption: a concise description of the image
                - confidence: your confidence from 0 to 1
            `,
                    },
                ],

                config: {
                    responseMimeType: "application/json",

                    responseSchema: {
                        type: Type.OBJECT,

                        properties: {
                            subject: {
                                type: Type.STRING,
                            },

                            category: {
                                type: Type.STRING,
                            },

                            attributes: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.STRING,
                                },
                            },

                            caption: {
                                type: Type.STRING,
                            },

                            confidence: {
                                type: Type.NUMBER,
                            },
                        },

                        required: ["subject", "category", "attributes", "caption", "confidence"],
                    },
                },
            }),
        {
            maxAttempts: 3,
            baseDelayMs: 1000,
            shouldRetry: isRetryableError,
        }
    );
    console.log(response.usageMetadata);
    const metadata = JSON.parse(response.text);

    const result = imageMetadataSchema.safeParse(metadata);

    if (!result.success) {
        console.error("Invalid Gemini metadata:", result.error.issues);
        throw new Error("Gemini returned invalid image metadata");
    }

    return {
        metadata: result.data,
        usage: response.usageMetadata ?? null,
    };
}