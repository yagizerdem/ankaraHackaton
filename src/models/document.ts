import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: { type: String, required: true, trim: true },
    extension: { type: String, required: true, lowercase: true, trim: true },
    mimeType: { type: String, required: true, trim: true },
    content: { type: Buffer, required: true },
    pageCount: { type: Number, required: false },
  },
  { timestamps: true },
);

export type Document = mongoose.InferSchemaType<typeof documentSchema>;
export type DocumentDocument = mongoose.HydratedDocument<Document>;

// Reuse the registered model on hot reload / warm serverless invocations.
export const Document =
  (mongoose.models.Document as mongoose.Model<Document>) ||
  mongoose.model<Document>("Document", documentSchema);
