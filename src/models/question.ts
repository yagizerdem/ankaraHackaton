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

// Reuse the registered model on hot reload / warm serverless invocations.
export const Question =
  (mongoose.models.Question as mongoose.Model<Question>) ||
  mongoose.model<Question>("Question", questionSchema);
