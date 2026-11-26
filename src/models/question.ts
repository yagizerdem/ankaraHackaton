import mongoose from "mongoose";

export const QUESTION_DIFFICULTIES = ["easy", "medium", "hard"] as const;
export type QuestionDifficulty = (typeof QUESTION_DIFFICULTIES)[number];

/** A generated multiple-choice question, cached so later exams can reuse it. */
const questionSchema = new mongoose.Schema(
  {
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
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document",
      required: true,
    },
    prompt: { type: String, required: true },
    options: {
      type: [
        {
          _id: false,
          id: { type: String, required: true },
          text: { type: String, required: true },
          /**
           * For wrong options: the misconception that leads a student to pick
           * it, so repeated mistakes can be grouped. Never sent before answering.
           */
          misconception: { type: String, default: null },
        },
      ],
      validate: {
        validator: (options: { id: string }[]) => options.length === 4,
        message: "A question needs exactly 4 options",
      },
    },
    /** Never sent to the client before the student answers. */
    correctOptionId: { type: String, required: true },
    explanation: { type: String, required: true },
    difficulty: { type: String, enum: QUESTION_DIFFICULTIES, required: true },
    /** Chunks the question was grounded in; empty if none were retrieved. */
    sourceChunkIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Embedding" }],
    sourcePages: [Number],
    generationModel: { type: String, required: true },
  },
  { timestamps: true },
);

questionSchema.index({ topicId: 1, difficulty: 1 });

export type Question = mongoose.InferSchemaType<typeof questionSchema>;
export type QuestionDocument = mongoose.HydratedDocument<Question>;

// In development, re-register on hot reload: reusing the cached model keeps
// the old schema, and mongoose then silently drops newly added fields.
if (process.env.NODE_ENV !== "production" && mongoose.models.Question) {
  mongoose.deleteModel("Question");
}

// Reuse the registered model on hot reload / warm serverless invocations.
export const Question =
  (mongoose.models.Question as mongoose.Model<Question>) ||
  mongoose.model<Question>("Question", questionSchema);
