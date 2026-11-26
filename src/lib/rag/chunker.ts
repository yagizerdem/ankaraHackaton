import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

export interface ChunkOptions {
  /** Max characters per chunk (~4 chars per token for English). */
  chunkSize?: number;
  /** Characters shared between neighbouring chunks so context isn't cut mid-thought. */
  chunkOverlap?: number;
}

export interface TextChunk {
  index: number;
  content: string;
  /** 1-based line range in the source text, for citing where a chunk came from. */
  lines: { from: number; to: number };
}

const DEFAULT_CHUNK_SIZE = 1000;
const DEFAULT_CHUNK_OVERLAP = 200;

/**
 * Splits text into overlapping chunks for embedding. Splits on paragraphs
 * first, then lines, sentences and words, so chunks break at the most natural
 * boundary that still fits chunkSize.
 */
export async function chunkText(
  text: string,
  {
    chunkSize = DEFAULT_CHUNK_SIZE,
    chunkOverlap = DEFAULT_CHUNK_OVERLAP,
  }: ChunkOptions = {},
): Promise<TextChunk[]> {
  if (chunkOverlap >= chunkSize) {
    throw new Error("chunkOverlap must be smaller than chunkSize");
  }

  // PDF extraction leaves \r\n, trailing spaces and runs of blank lines; fold
  // them so the paragraph separator ("\n\n") actually matches.
  const normalized = text
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (!normalized) return [];

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize,
    chunkOverlap,
    separators: ["\n\n", "\n", ". ", "? ", "! ", " ", ""],
  });
  const documents = await splitter.createDocuments([normalized]);

  return documents.map((document, index) => ({
    index,
    content: document.pageContent,
    lines: document.metadata.loc.lines,
  }));
}
