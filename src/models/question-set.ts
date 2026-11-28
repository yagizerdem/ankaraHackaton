import mongoose from "mongoose";

import {
  EXAM_DIFFICULTIES,
  EXAM_LANGUAGES,
  QUESTION_TYPES,
} from "@/domain/custom-exam";

const questionSchema = new mongoose.Schema(
  {
    type: { type: String, enum: QUESTION_TYPES, required: true },
    prompt: { type: String, required: true },
    /** Only multiple choice questions have options. */
    options: {
      type: [
        {
          _id: false,
          id: { type: String, required: true },
          text: { type: String, required: true },
        },
      ],
      default: [],
    },
    /** Option id, "true" / "false", or a model answer for open-ended. */
    answer: { type: String, required: true },
    explanation: { type: String, default: "" },
    sourceExcerpt: { type: String, default: "" },
    keywords: { type: [String], default: [] },
  },
  { _id: false },
);

/** A custom exam the student generated from one of their documents. */
const questionSetSchema = new mongoose.Schema(
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
    /** Copied so the exam still reads well after the document is deleted. */
    documentName: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    types: [{ type: String, enum: QUESTION_TYPES, required: true }],
    difficulty: { type: String, enum: EXAM_DIFFICULTIES, required: true },
    language: { type: String, enum: EXAM_LANGUAGES, required: true },
    questions: { type: [questionSchema], default: [] },
    /** The Gemini model that wrote the questions. */
    aiModel: { type: String, required: true },
  },
  { timestamps: true },
);

questionSetSchema.index({ userId: 1, createdAt: -1 });

export type QuestionSet = mongoose.InferSchemaType<typeof questionSetSchema>;
export type QuestionSetDocument = mongoose.HydratedDocument<QuestionSet>;

// Reuse the registered model on hot reload / warm serverless invocations.
export const QuestionSet =
  (mongoose.models.QuestionSet as mongoose.Model<QuestionSet>) ||
  mongoose.model<QuestionSet>("QuestionSet", questionSetSchema);
