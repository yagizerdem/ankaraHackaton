import mongoose from "mongoose";

export const ASSESSMENT_STATUSES = ["in_progress", "completed"] as const;

const answerSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      required: true,
    },
    topicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TopicNode",
      required: true,
    },
    selectedOptionId: { type: String, required: true },
    correct: { type: Boolean, required: true },
    answeredAt: { type: Date, required: true },
  },
  { _id: false },
);

/** A topic waiting to be tested, with why the exam wants to test it. */
const pendingTopicSchema = new mongoose.Schema(
  {
    topicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TopicNode",
      required: true,
    },
    reason: { type: String, required: true },
  },
  { _id: false },
);

/** One adaptive exam run on a knowledge graph. */
const assessmentSchema = new mongoose.Schema(
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
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document",
      required: true,
    },
    /** Topics the exam is aimed at; gap analysis walks back from these. */
    targetTopicIds: [
      { type: mongoose.Schema.Types.ObjectId, ref: "TopicNode" },
    ],
    questionBudget: { type: Number, required: true, min: 1, max: 30 },
    status: {
      type: String,
      enum: ASSESSMENT_STATUSES,
      required: true,
      default: "in_progress",
    },
    /** Queue of topics still to test, front first. */
    pending: { type: [pendingTopicSchema], default: [] },
    currentQuestionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      default: null,
    },
    currentReason: { type: String, default: null },
    answers: { type: [answerSchema], default: [] },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

assessmentSchema.index({ userId: 1, createdAt: -1 });

export type Assessment = mongoose.InferSchemaType<typeof assessmentSchema>;
export type AssessmentDocument = mongoose.HydratedDocument<Assessment>;

// Reuse the registered model on hot reload / warm serverless invocations.
export const Assessment =
  (mongoose.models.Assessment as mongoose.Model<Assessment>) ||
  mongoose.model<Assessment>("Assessment", assessmentSchema);
