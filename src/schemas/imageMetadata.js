import { z } from "zod";

export const imageMetadataSchema = z.object({
    subject: z.string().min(1),
    category: z.string().min(1),
    attributes: z.array(z.string()),
    caption: z.string().min(1),
    confidence: z.number().min(0).max(1),
});