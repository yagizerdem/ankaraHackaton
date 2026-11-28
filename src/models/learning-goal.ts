import mongoose from "mongoose";

/** A student's goal on one graph: master a topic before a date. */
const learningGoalSchema = new mongoose.Schema(
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
    targetTopicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TopicNode",
      required: true,
    },
    /** The exam day; the route is split across the days before it. */
    examDate: { type: Date, required: true },
  },
  { timestamps: true },
);

// One active goal per graph; setting a new one replaces it.
learningGoalSchema.index({ userId: 1, graphId: 1 }, { unique: true });

export type LearningGoal = mongoose.InferSchemaType<typeof learningGoalSchema>;
export type LearningGoalDocument = mongoose.HydratedDocument<LearningGoal>;

// Reuse the registered model on hot reload / warm serverless invocations.
export const LearningGoal =
  (mongoose.models.LearningGoal as mongoose.Model<LearningGoal>) ||
  mongoose.model<LearningGoal>("LearningGoal", learningGoalSchema);
