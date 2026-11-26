import * as z from "zod";

export function createKnowledgeGraphRequestSchema() {
  const requestSchema = z.object({
    documentId: z
      .string()
      .regex(/^[a-f\d]{24}$/i, "documentId must be a valid id"),
  });
  return requestSchema;
}

export type KnowledgeGraphInput = z.infer<
  ReturnType<typeof createKnowledgeGraphRequestSchema>
>;

export interface KnowledgeGraphResponse {
  graphId: string;
  documentId: string;
  model: string;
  nodeCount: number;
  edgeCount: number;
}
