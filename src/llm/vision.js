import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

export async function analyzeImage(imageBase64, mimeType) {
    const response = await ai.models.generateContent({
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
    });

    return JSON.parse(response.text);
}