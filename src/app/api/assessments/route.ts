import { cookies } from "next/headers";

import { createStartAssessmentSchema } from "@/domain/assessment";
import { AppError } from "@/error/app-error";
import { withErrorHandler } from "@/error/with-error-handler";
import { listAssessments, startAssessment } from "@/lib/assessment/service";
import { ApiResponse } from "@/lib/api-response";
import { SESSION_COOKIE, verifySessionAndGetUser } from "@/lib/auth";
import dbConnect from "@/lib/db";
import HttpStatusCode from "@/lib/http-status-code";
import { getJsonBody, zodErrorToFromErrors } from "@/lib/utils";

import type { AssessmentSummary, AssessmentView } from "@/domain/assessment";

// Starting writes the whole exam with one Gemini call, which can take a while.
export const maxDuration = 120;

async function requireUser() {
  await dbConnect();
  const user = await verifySessionAndGetUser(
    (await cookies()).get(SESSION_COOKIE)?.value,
  );
  if (!user) throw new AppError("Sign in required", HttpStatusCode.UNAUTHORIZED);
  return user;
}

/** The signed-in user's recent exams. */
export const GET = withErrorHandler(async () => {
  const user = await requireUser();
  return Response.json(
    ApiResponse.ok<AssessmentSummary[]>(await listAssessments(user._id)),
    { status: HttpStatusCode.OK },
  );
});

/** Starts an adaptive exam on a knowledge graph and returns its first question. */
export const POST = withErrorHandler(async (request: Request) => {
  const user = await requireUser();

  const parsed = createStartAssessmentSchema().safeParse(await getJsonBody(request));
  if (!parsed.success) {
    throw new AppError(
      "Validation failed",
      HttpStatusCode.BAD_REQUEST,
      true,
      zodErrorToFromErrors(parsed.error),
    );
  }

  let assessment: AssessmentView;
  try {
    assessment = await startAssessment(user._id, parsed.data, request.signal);
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error(error);
    throw new AppError(
      "Couldn't write the exam; try again",
      HttpStatusCode.BAD_GATEWAY,
    );
  }

  return Response.json(ApiResponse.created(assessment, "Exam started"), {
    status: HttpStatusCode.CREATED,
  });
});
