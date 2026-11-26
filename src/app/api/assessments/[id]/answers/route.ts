import { cookies } from "next/headers";

import { createAnswerSchema } from "@/domain/assessment";
import { AppError } from "@/error/app-error";
import { withErrorHandler } from "@/error/with-error-handler";
import { answerQuestion } from "@/lib/assessment/service";
import { ApiResponse } from "@/lib/api-response";
import { SESSION_COOKIE, verifySessionAndGetUser } from "@/lib/auth";
import dbConnect from "@/lib/db";
import HttpStatusCode from "@/lib/http-status-code";
import { getJsonBody, zodErrorToFromErrors } from "@/lib/utils";

import type { AnswerFeedback } from "@/domain/assessment";

/**
 * Checks an answer on the server and updates mastery. Only plans the next
 * step; GET /api/assessments/[id] then generates the next question.
 */
export const POST = withErrorHandler(
  async (
    request: Request,
    context: RouteContext<"/api/assessments/[id]/answers">,
  ) => {
    const { id } = await context.params;

    await dbConnect();
    const user = await verifySessionAndGetUser(
      (await cookies()).get(SESSION_COOKIE)?.value,
    );
    if (!user) throw new AppError("Sign in required", HttpStatusCode.UNAUTHORIZED);

    const parsed = createAnswerSchema().safeParse(await getJsonBody(request));
    if (!parsed.success) {
      throw new AppError(
        "Validation failed",
        HttpStatusCode.BAD_REQUEST,
        true,
        zodErrorToFromErrors(parsed.error),
      );
    }

    const feedback = await answerQuestion(id, user._id, parsed.data);

    return Response.json(
      ApiResponse.ok<AnswerFeedback>(
        feedback,
        feedback.correct ? "Correct" : "Not quite",
      ),
      { status: HttpStatusCode.OK },
    );
  },
);
