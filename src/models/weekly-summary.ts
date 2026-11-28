import mongoose from "mongoose";

/** A Gemini-written note on the student's last 7 days on one graph. */
const weeklySummarySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    graphId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "KnowledgeGraph",
      required: true,
    },
    text: { type: String, required: true },
    /** The numbers the note was written from, kept to check it against. */
    stats: { type: mongoose.Schema.Types.Mixed, required: true },
    generationModel: { type: String, required: true },
  },
  { timestamps: true },
);

weeklySummarySchema.index({ userId: 1, graphId: 1, createdAt: -1 });

export type WeeklySummary = mongoose.InferSchemaType<typeof weeklySummarySchema>;
export type WeeklySummaryDocument = mongoose.HydratedDocument<WeeklySummary>;

// Reuse the registered model on hot reload / warm serverless invocations.
export const WeeklySummary =
  (mongoose.models.WeeklySummary as mongoose.Model<WeeklySummary>) ||
  mongoose.model<WeeklySummary>("WeeklySummary", weeklySummarySchema);
