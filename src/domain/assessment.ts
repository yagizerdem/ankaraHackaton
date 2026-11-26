import * as z from "zod";

import type { MasteryStatus } from "@/lib/assessment/mastery";
import type { Calibration } from "@/lib/learning/calibration";

const objectId = (name: string) =>
  z.string().regex(/^[a-f\d]{24}$/i, `${name} must be a valid id`);

export const QUESTION_BUDGETS = [6, 9, 12] as const;

export function createStartAssessmentSchema() {
  return z.object({
    graphId: objectId("graphId"),
    /** Optional; without it the exam targets the graph's key topics. */
    targetTopicId: objectId("targetTopicId").optional(),
    questionBudget: z
      .number()
      .int()
      .refine(
        (value) => (QUESTION_BUDGETS as readonly number[]).includes(value),
        `questionBudget must be one of ${QUESTION_BUDGETS.join(", ")}`,
      )
      .default(9),
  });
}

export function createAnswerSchema() {
  return z.object({
    questionId: objectId("questionId"),
    optionId: z.enum(["a", "b", "c", "d"], {
      error: "Choose one of the options",
    }),
    confidence: z.enum(["sure", "unsure", "guess"], {
      error: "Say how sure you are",
    }),
  });
}

export type StartAssessmentInput = z.infer<
  ReturnType<typeof createStartAssessmentSchema>
>;
export type AnswerInput = z.infer<ReturnType<typeof createAnswerSchema>>;

/** A question as the student sees it: no correct answer, no explanation. */
export interface QuestionView {
  id: string;
  number: number;
  topicId: string;
  topicLabel: string;
  /** Why the adaptive engine picked this topic. */
  reason: string;
  prompt: string;
  options: { id: string; text: string }[];
  difficulty: "easy" | "medium" | "hard";
}

export interface TopicResult {
  topicId: string;
  label: string;
  examCorrect: number;
  examTotal: number;
  /** Across every exam, 0-1. */
  mastery: number;
  evidence: number;
  status: MasteryStatus;
}

export interface GapAnalysis {
  targetId: string;
  targetLabel: string;
  targetStatus: MasteryStatus;
  weak: { id: string; label: string; mastery: number }[];
  unmeasured: { id: string; label: string }[];
  recommendation: string;
}

export interface AssessmentResults {
  topics: TopicResult[];
  gaps: GapAnalysis[];
  /** How well confidence matched results in this exam. */
  calibration: Calibration;
}

export interface AssessmentView {
  id: string;
  graphId: string;
  documentName: string;
  status: "in_progress" | "completed";
  questionBudget: number;
  answeredCount: number;
  correctCount: number;
  current: QuestionView | null;
  results: AssessmentResults | null;
  createdAt: string;
}

export interface AnswerFeedback {
  correct: boolean;
  selectedOptionId: string;
  correctOptionId: string;
  explanation: string;
  /** The misconception behind the chosen wrong option, if known. */
  misconception: string | null;
  sourcePages: number[];
  sources: { id: string; excerpt: string; lines: { from: number; to: number } }[];
  /** The exam after this answer: the next question, or the results. */
  assessment: AssessmentView;
}

export interface AssessmentSummary {
  id: string;
  graphId: string;
  documentName: string;
  status: "in_progress" | "completed";
  questionBudget: number;
  answeredCount: number;
  correctCount: number;
  createdAt: string;
}
