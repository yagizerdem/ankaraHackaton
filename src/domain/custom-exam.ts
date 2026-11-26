import * as z from "zod";

export const QUESTION_TYPES = ["multiple_choice", "true_false", "open_ended"] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  multiple_choice: "Multiple choice",
  true_false: "True / false",
  open_ended: "Open-ended",
};

export const EXAM_DIFFICULTIES = ["easy", "medium", "hard", "expert"] as const;
export type ExamDifficulty = (typeof EXAM_DIFFICULTIES)[number];

export const EXAM_LANGUAGES = ["english", "turkish"] as const;
export type ExamLanguage = (typeof EXAM_LANGUAGES)[number];

export const EXAM_LANGUAGE_LABELS: Record<ExamLanguage, string> = {
  english: "English",
  turkish: "Türkçe",
};

export const MAX_EXAM_QUESTIONS = 20;

export function createCustomExamSchema() {
  return z.object({
    documentId: z
      .string()
      .regex(/^[a-f\d]{24}$/i, "Choose one of your documents"),
    title: z
      .string()
      .trim()
      .max(120, "Keep the title under 120 characters")
      .optional(),
    types: z
      .array(z.enum(QUESTION_TYPES))
      .min(1, "Choose at least one question type")
      .transform((types) => [...new Set(types)]),
    difficulty: z.enum(EXAM_DIFFICULTIES, { error: "Choose a difficulty" }),
    language: z.enum(EXAM_LANGUAGES, { error: "Choose a language" }),
    questionCount: z
      .number({ error: "Enter how many questions you want" })
      .int()
      .min(1, "Ask for at least 1 question")
      .max(MAX_EXAM_QUESTIONS, `Ask for at most ${MAX_EXAM_QUESTIONS} questions`),
  });
}

export type CustomExamInput = z.input<ReturnType<typeof createCustomExamSchema>>;

export interface CustomExamQuestion {
  type: QuestionType;
  prompt: string;
  /** Four options for multiple choice; empty for the other types. */
  options: { id: string; text: string }[];
  /** Option id, "true" / "false", or a model answer for open-ended. */
  answer: string;
  explanation: string;
  /** Verbatim excerpt from the document that supports the answer. */
  sourceExcerpt: string;
  keywords: string[];
}

export interface CustomExamSummary {
  id: string;
  title: string;
  documentId: string;
  documentName: string;
  types: QuestionType[];
  difficulty: ExamDifficulty;
  language: ExamLanguage;
  questionCount: number;
  createdAt: string;
}

export interface CustomExam extends CustomExamSummary {
  aiModel: string;
  questions: CustomExamQuestion[];
}

export interface DeleteCustomExamResponse {
  id: string;
}
