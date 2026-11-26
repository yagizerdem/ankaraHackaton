import * as z from "zod";

const objectId = (name: string) =>
  z.string().regex(/^[a-f\d]{24}$/i, `${name} must be a valid id`);

/** The goal form can look this far ahead. */
export const MAX_GOAL_DAYS = 180;

export function createGoalSchema(today = new Date()) {
  const todayIso = today.toISOString().slice(0, 10);
  const max = new Date(today.getTime() + MAX_GOAL_DAYS * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  return z.object({
    graphId: objectId("graphId"),
    targetTopicId: objectId("targetTopicId"),
    examDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date")
      .refine((value) => value > todayIso, "Pick a day after today")
      .refine((value) => value <= max, `Pick a day within ${MAX_GOAL_DAYS} days`),
  });
}

export function createGraphRequestSchema() {
  return z.object({ graphId: objectId("graphId") });
}

export type GoalInput = z.infer<ReturnType<typeof createGoalSchema>>;

export interface GoalResponse {
  targetTopicId: string;
  examDate: string;
}

export interface SummaryResponse {
  text: string;
  createdAt: string;
}

export interface ShareResponse {
  /** Raw token; only its hash is stored, so it can't be shown again. */
  token: string;
  expiresAt: string;
}
