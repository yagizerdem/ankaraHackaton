import type mongoose from "mongoose";

import { AppError } from "@/error/app-error";
import { GENERATION_MODEL } from "@/lib/ai/gemini";
import { COVERAGE_QUERIES, generateCustomExam } from "@/lib/custom-exam/generate";
import HttpStatusCode from "@/lib/http-status-code";
import { retrieveChunks } from "@/lib/rag/retrieve";
import { Document } from "@/models/document";
import { Embedding } from "@/models/embedding";
import { QuestionSet } from "@/models/question-set";

import type {
  CustomExam,
  CustomExamInput,
  CustomExamSummary,
  ExamDifficulty,
  ExamLanguage,
  QuestionType,
} from "@/domain/custom-exam";
import type { RetrievedChunk } from "@/lib/rag/retrieve";

type UserId = mongoose.Types.ObjectId;
type ParsedInput = Omit<CustomExamInput, "types"> & { types: QuestionType[] };

const CHUNKS_PER_QUERY = 4;

interface StoredSet {
  _id: mongoose.Types.ObjectId;
  title: string;
  documentId: mongoose.Types.ObjectId;
  documentName: string;
  types: string[];
  difficulty: string;
  language: string;
  questions: CustomExam["questions"];
  aiModel: string;
  createdAt: Date;
}

function toSummary(set: Omit<StoredSet, "questions" | "aiModel">, questionCount: number): CustomExamSummary {
  return {
    id: set._id.toString(),
    title: set.title,
    documentId: set.documentId.toString(),
    documentName: set.documentName,
    types: set.types as QuestionType[],
    difficulty: set.difficulty as ExamDifficulty,
    language: set.language as ExamLanguage,
    questionCount,
    createdAt: set.createdAt.toISOString(),
  };
}

function toExam(set: StoredSet): CustomExam {
  return {
    ...toSummary(set, set.questions.length),
    aiModel: set.aiModel,
    questions: set.questions.map((question) => ({
      type: question.type,
      prompt: question.prompt,
      options: question.options.map((option) => ({ id: option.id, text: option.text })),
      answer: question.answer,
      explanation: question.explanation,
      sourceExcerpt: question.sourceExcerpt,
      keywords: [...question.keywords],
    })),
  };
}

/**
 * Generates an exam from one of the user's documents and stores it. The
 * document must already be embedded: the questions come from its chunks.
 */
export async function createCustomExam(
  userId: UserId,
  input: ParsedInput,
  signal?: AbortSignal,
): Promise<CustomExam> {
  // Scoped to the user, so another user's id reads as not found.
  const document = await Document.findOne({ _id: input.documentId, userId })
    .select("name")
    .lean();
  if (!document) throw new AppError("Document not found", HttpStatusCode.NOT_FOUND);

  const hasChunks = await Embedding.exists({ documentId: document._id });
  if (!hasChunks) {
    throw new AppError(
      "This document has no embeddings yet; finish its upload pipeline first",
      HttpStatusCode.UNPROCESSABLE_ENTITY,
    );
  }

  const results = await Promise.all(
    COVERAGE_QUERIES.map((query) =>
      retrieveChunks(document._id, query, { limit: CHUNKS_PER_QUERY, signal }),
    ),
  );
  const sources: RetrievedChunk[] = [
    ...new Map(results.flat().map((chunk) => [chunk.id, chunk])).values(),
  ].sort((a, b) => a.index - b.index);

  const questions = await generateCustomExam(sources, {
    types: input.types,
    questionCount: input.questionCount,
    difficulty: input.difficulty,
    language: input.language,
    signal,
  });

  const set = await QuestionSet.create({
    userId,
    documentId: document._id,
    documentName: document.name,
    title: input.title?.trim() || `${document.name.replace(/\.[^.]+$/, "")} exam`,
    // Only the types that actually made it into the exam.
    types: input.types.filter((type) => questions.some((q) => q.type === type)),
    difficulty: input.difficulty,
    language: input.language,
    questions,
    aiModel: GENERATION_MODEL,
  });

  return toExam(set.toObject() as StoredSet);
}

/** The user's exams, newest first, without their questions. */
export async function listCustomExams(userId: UserId): Promise<CustomExamSummary[]> {
  const sets = await QuestionSet.aggregate<
    Omit<StoredSet, "questions" | "aiModel"> & { questionCount: number }
  >([
    { $match: { userId } },
    { $sort: { createdAt: -1 } },
    {
      $project: {
        title: 1,
        documentId: 1,
        documentName: 1,
        types: 1,
        difficulty: 1,
        language: 1,
        createdAt: 1,
        questionCount: { $size: "$questions" },
      },
    },
  ]);
  return sets.map((set) => toSummary(set, set.questionCount));
}

/** One of the user's exams with its questions, or null. */
export async function getCustomExam(id: string, userId: UserId): Promise<CustomExam | null> {
  if (!/^[a-f\d]{24}$/i.test(id)) return null;
  const set = await QuestionSet.findOne({ _id: id, userId }).lean();
  return set ? toExam(set as unknown as StoredSet) : null;
}

/** Deletes one of the user's exams; false when there was none. */
export async function deleteCustomExam(id: string, userId: UserId) {
  const result = await QuestionSet.deleteOne({ _id: id, userId });
  return result.deletedCount > 0;
}
