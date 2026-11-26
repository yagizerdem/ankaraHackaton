import { createGoalSchema, createGraphRequestSchema } from "@/domain/learning-path";
import { AppError } from "@/error/app-error";
import { withErrorHandler } from "@/error/with-error-handler";
import { loadGraph } from "@/lib/assessment/service";
import { ApiResponse } from "@/lib/api-response";
import HttpStatusCode from "@/lib/http-status-code";
import { parseOrThrow, requireUser } from "@/lib/learning/require-user";
import { getJsonBody } from "@/lib/utils";
import { LearningGoal } from "@/models/learning-goal";

import type { GoalResponse } from "@/domain/learning-path";

/** Sets (or replaces) the student's goal topic and exam date on a graph. */
export const PUT = withErrorHandler(async (request: Request) => {
  const user = await requireUser();
  const input = parseOrThrow(createGoalSchema(), await getJsonBody(request));

  const context = await loadGraph(input.graphId, user._id);
  if (!context.topicsById.has(input.targetTopicId)) {
    throw new AppError("Validation failed", HttpStatusCode.BAD_REQUEST, true, {
      targetTopicId: "This topic isn't in the selected graph",
    });
  }

  await LearningGoal.findOneAndUpdate(
    { userId: user._id, graphId: context.graph._id },
    {
      targetTopicId: input.targetTopicId,
      // Noon UTC, so the calendar day survives any time zone.
      examDate: new Date(`${input.examDate}T12:00:00Z`),
    },
    { upsert: true },
  );

  return Response.json(
    ApiResponse.ok<GoalResponse>(
      { targetTopicId: input.targetTopicId, examDate: input.examDate },
      "Goal saved",
    ),
    { status: HttpStatusCode.OK },
  );
});

/** Clears the goal on a graph. */
export const DELETE = withErrorHandler(async (request: Request) => {
  const user = await requireUser();
  const { graphId } = parseOrThrow(createGraphRequestSchema(), await getJsonBody(request));

  const context = await loadGraph(graphId, user._id);
  await LearningGoal.deleteOne({ userId: user._id, graphId: context.graph._id });

  return Response.json(ApiResponse.ok(undefined, "Goal cleared"), {
    status: HttpStatusCode.OK,
  });
});
