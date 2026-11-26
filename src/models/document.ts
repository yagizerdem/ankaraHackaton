import mongoose from "mongoose";

export interface Document {
  name: string;
  extension: string;
  mimeType: string;
  content: Buffer;
  createdAt: Date;
  updatedAt: Date;
}

const documentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    extension: { type: String, required: true, lowercase: true, trim: true },
    mimeType: { type: String, required: true, trim: true },
    content: { type: Buffer, required: true },
  },
  { timestamps: true },
);

// Reuse the registered model on hot reload / warm serverless invocations.
export const Document =
  (mongoose.models.Document as mongoose.Model<Document>) ||
  mongoose.model<Document>("Document", documentSchema);
