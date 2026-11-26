import { createCustomExamSchema } from "@/domain/custom-exam";
import { AppError } from "@/error/app-error";
import { withErrorHandler } from "@/error/with-error-handler";
import { ApiResponse } from "@/lib/api-response";
import { createCustomExam, listCustomExams } from "@/lib/custom-exam/service";
import HttpStatusCode from "@/lib/http-status-code";
import { parseOrThrow, requireUser } from "@/lib/learning/require-user";
import { getJsonBody } from "@/lib/utils";

import type { CustomExam, CustomExamSummary } from "@/domain/custom-exam";

// Retrieval plus one or two Gemini calls for up to 20 questions.
export const maxDuration = 120;

/** The signed-in user's custom exams, newest first. */
export const GET = withErrorHandler(async () => {
  const user = await requireUser();
  return Response.json(
    ApiResponse.ok<CustomExamSummary[]>(await listCustomExams(user._id)),
    { status: HttpStatusCode.OK },
  );
});

/** Generates a custom exam from one of the user's documents and saves it. */
export const POST = withErrorHandler(async (request: Request) => {
  const user = await requireUser();
  const input = parseOrThrow(createCustomExamSchema(), await getJsonBody(request));

  let exam: CustomExam;
  try {
    exam = await createCustomExam(user._id, input, request.signal);
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error(error);
    throw new AppError("Couldn't write the exam; try again", HttpStatusCode.BAD_GATEWAY);
  }

  return Response.json(ApiResponse.created(exam, "Exam created"), {
    status: HttpStatusCode.CREATED,
  });
});
