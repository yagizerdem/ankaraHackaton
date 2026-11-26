import type mongoose from "mongoose";

import { embedQuery } from "@/lib/rag/embeddings";
import { Embedding } from "@/models/embedding";

export interface RetrievedChunk {
  id: string;
  index: number;
  content: string;
  lines: { from: number; to: number };
  /** Cosine similarity to the query, -1 to 1. */
  score: number;
}

export interface RetrieveOptions {
  limit?: number;
  signal?: AbortSignal;
}

/**
 * The chunks of one document closest to `query`.
 *
 * The local `mongo` image has no $vectorSearch, so this ranks the document's
 * chunks in memory. That is fine at the 50-page upload limit (a few hundred
 * chunks); on Atlas, swap the scan for a $vectorSearch stage filtered by
 * documentId. Callers must check the user can read the document first.
 */
export async function retrieveChunks(
  documentId: mongoose.Types.ObjectId | string,
  query: string,
  { limit = 5, signal }: RetrieveOptions = {},
): Promise<RetrievedChunk[]> {
  const chunks = await Embedding.find({ documentId })
    .select("index content lines embedding")
    .lean();
  if (chunks.length === 0) return [];

  const queryVector = await embedQuery(query, { signal });

  // Both sides are L2-normalized, so the dot product is the cosine.
  return chunks
    .map((chunk) => ({
      id: chunk._id.toString(),
      index: chunk.index,
      content: chunk.content,
      lines: { from: chunk.lines?.from ?? 1, to: chunk.lines?.to ?? 1 },
      score: chunk.embedding.reduce(
        (sum, value, i) => sum + value * queryVector[i],
        0,
      ),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
