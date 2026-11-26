import { cookies } from "next/headers";

import { AppError } from "@/error/app-error";
import { withErrorHandler } from "@/error/with-error-handler";
import { getAssessment } from "@/lib/assessment/service";
import { ApiResponse } from "@/lib/api-response";
import { SESSION_COOKIE, verifySessionAndGetUser } from "@/lib/auth";
import dbConnect from "@/lib/db";
import HttpStatusCode from "@/lib/http-status-code";

import type { AssessmentView } from "@/domain/assessment";

// May regenerate a question that failed earlier.
export const maxDuration = 60;

/** The exam's current question, or its results once finished. */
export const GET = withErrorHandler(
  async (request: Request, context: RouteContext<"/api/assessments/[id]">) => {
    const { id } = await context.params;

    await dbConnect();
    const user = await verifySessionAndGetUser(
      (await cookies()).get(SESSION_COOKIE)?.value,
    );
    if (!user) throw new AppError("Sign in required", HttpStatusCode.UNAUTHORIZED);

    let assessment: AssessmentView;
    try {
      assessment = await getAssessment(id, user._id, request.signal);
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error(error);
      throw new AppError(
        "Couldn't prepare the next question; try again",
        HttpStatusCode.BAD_GATEWAY,
      );
    }

    return Response.json(ApiResponse.ok(assessment), { status: HttpStatusCode.OK });
  },
);
