import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

export async function generateEmbedding(text) {
    const response = await ai.models.embedContent({
        model: process.env.GEMINI_EMBEDDING_MODEL,
        contents: text,
        config: {
            outputDimensionality: 768,
        },
    });

    return response.embeddings[0].values;
}