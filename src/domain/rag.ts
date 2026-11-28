import * as z from "zod";

export function createEmbeddingRequestSchema() {
  return z.object({
    documentId: z
      .string()
      .regex(/^[a-f\d]{24}$/i, "documentId must be a valid id"),
  });
}

export type EmbeddingInput = z.infer<
  ReturnType<typeof createEmbeddingRequestSchema>
>;

export interface EmbeddingResponse {
  documentId: string;
  model: string;
  dimensions: number;
  chunkCount: number;
}
