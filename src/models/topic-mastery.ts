import mongoose from "mongoose";

/**
 * A student's evidence on one topic across every exam. Stored apart from the
 * graph, so one course graph can be shared by many students.
 */
const topicMasterySchema = new mongoose.Schema(
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
    topicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TopicNode",
      required: true,
    },
    correct: { type: Number, required: true, min: 0, default: 0 },
    incorrect: { type: Number, required: true, min: 0, default: 0 },
  },
  { timestamps: true },
);

topicMasterySchema.index({ userId: 1, topicId: 1 }, { unique: true });
topicMasterySchema.index({ userId: 1, graphId: 1 });

export type TopicMastery = mongoose.InferSchemaType<typeof topicMasterySchema>;
export type TopicMasteryDocument = mongoose.HydratedDocument<TopicMastery>;

// Reuse the registered model on hot reload / warm serverless invocations.
export const TopicMastery =
  (mongoose.models.TopicMastery as mongoose.Model<TopicMastery>) ||
  mongoose.model<TopicMastery>("TopicMastery", topicMasterySchema);
