import { GoogleGenAI } from "@google/genai";
import type { TextChunk } from "./chunker";

export const EMBEDDING_MODEL = "gemini-embedding-001";
/** 768 keeps vector indexes small; the model also supports 1536 and 3072. */
export const EMBEDDING_DIMENSIONS = 768;
/** The Gemini API rejects embedContent calls with more than 100 inputs. */
const MAX_BATCH_SIZE = 100;

export interface EmbeddedChunk extends TextChunk {
  embedding: number[];
}

export interface EmbedOptions {
  /** Document title; Gemini uses it as extra context for RETRIEVAL_DOCUMENT. */
  title?: string;
  signal?: AbortSignal;
}

let client: GoogleGenAI | undefined;

function getClient() {
  if (!client) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
    client = new GoogleGenAI({ apiKey });
  }
  return client;
}

// Only the full 3072-dimension output comes normalized; truncated vectors
// must be rescaled to unit length for cosine/dot-product search to be right.
function normalize(values: number[]) {
  const norm = Math.hypot(...values);
  return norm === 0 ? values : values.map((value) => value / norm);
}

async function embedTexts(
  texts: string[],
  taskType: "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY",
  { title, signal }: EmbedOptions = {},
): Promise<number[][]> {
  const vectors: number[][] = [];

  for (let start = 0; start < texts.length; start += MAX_BATCH_SIZE) {
    const batch = texts.slice(start, start + MAX_BATCH_SIZE);
    const response = await getClient().models.embedContent({
      model: EMBEDDING_MODEL,
      contents: batch,
      config: {
        taskType,
        title: taskType === "RETRIEVAL_DOCUMENT" ? title : undefined,
        outputDimensionality: EMBEDDING_DIMENSIONS,
        abortSignal: signal,
      },
    });

    const embeddings = response.embeddings ?? [];
    if (embeddings.length !== batch.length) {
      throw new Error(
        `Expected ${batch.length} embeddings from ${EMBEDDING_MODEL}, got ${embeddings.length}`,
      );
    }
    for (const embedding of embeddings) {
      if (!embedding.values?.length) {
        throw new Error(`${EMBEDDING_MODEL} returned an empty embedding`);
      }
      vectors.push(normalize(embedding.values));
    }
  }

  return vectors;
}

/**
 * Embeds chunks from chunkText for storage in a vector index. Batches stay in
 * order, so each embedding lines up with its chunk.
 */
export async function embedChunks(
  chunks: TextChunk[],
  options?: EmbedOptions,
): Promise<EmbeddedChunk[]> {
  if (chunks.length === 0) return [];

  const vectors = await embedTexts(
    chunks.map((chunk) => chunk.content),
    "RETRIEVAL_DOCUMENT",
    options,
  );
  return chunks.map((chunk, i) => ({ ...chunk, embedding: vectors[i] }));
}

/** Embeds a search query in the same space as embedChunks, for retrieval. */
export async function embedQuery(query: string, options?: Omit<EmbedOptions, "title">) {
  const [vector] = await embedTexts([query], "RETRIEVAL_QUERY", options);
  return vector;
}
