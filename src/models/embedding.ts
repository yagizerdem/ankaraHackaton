import mongoose from "mongoose";

import { EMBEDDING_DIMENSIONS, EMBEDDING_MODEL } from "@/lib/rag/embeddings";

// One document per chunk, so a vector index can match and return chunks
// individually instead of whole documents.
const embeddingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document",
      required: true,
    },
    /** Position of the chunk in the document, from chunkText. */
    index: { type: Number, required: true, min: 0 },
    content: { type: String, required: true },
    /** 1-based line range in the source text, for citations. */
    lines: {
      from: { type: Number, required: true, min: 1 },
      to: { type: Number, required: true, min: 1 },
    },
    embedding: {
      type: [Number],
      required: true,
      validate: {
        validator: (values: number[]) =>
          values.length === EMBEDDING_DIMENSIONS,
        message: `embedding must have ${EMBEDDING_DIMENSIONS} dimensions`,
      },
    },
    /** Vectors from different models can't be compared, so keep the source. */
    embeddingModel: { type: String, required: true, default: EMBEDDING_MODEL },
  },
  { timestamps: true },
);

// Re-embedding a document replaces its chunks instead of duplicating them.
embeddingSchema.index({ documentId: 1, embeddingModel: 1, index: 1 }, { unique: true });
embeddingSchema.index({ userId: 1 });

export type Embedding = mongoose.InferSchemaType<typeof embeddingSchema>;
export type EmbeddingDocument = mongoose.HydratedDocument<Embedding>;

// Reuse the registered model on hot reload / warm serverless invocations.
export const Embedding =
  (mongoose.models.Embedding as mongoose.Model<Embedding>) ||
  mongoose.model<Embedding>("Embedding", embeddingSchema);
