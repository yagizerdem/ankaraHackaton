import { AppError } from "@/error/app-error";
import { withErrorHandler } from "@/error/with-error-handler";
import { ApiResponse } from "@/lib/api-response";
import { deleteCustomExam, getCustomExam } from "@/lib/custom-exam/service";
import HttpStatusCode from "@/lib/http-status-code";
import { requireUser } from "@/lib/learning/require-user";

import type { CustomExam, DeleteCustomExamResponse } from "@/domain/custom-exam";

function assertId(id: string) {
  if (!/^[a-f\d]{24}$/i.test(id)) {
    throw new AppError("Validation failed", HttpStatusCode.BAD_REQUEST, true, {
      id: "id must be a valid exam id",
    });
  }
}

/** One of the user's custom exams with its questions and answers. */
export const GET = withErrorHandler(
  async (_request: Request, context: RouteContext<"/api/custom-exams/[id]">) => {
    const { id } = await context.params;
    assertId(id);
    const user = await requireUser();

    const exam = await getCustomExam(id, user._id);
    if (!exam) throw new AppError("Exam not found", HttpStatusCode.NOT_FOUND);

    return Response.json(ApiResponse.ok<CustomExam>(exam), { status: HttpStatusCode.OK });
  },
);

/** Deletes one of the user's custom exams. */
export const DELETE = withErrorHandler(
  async (_request: Request, context: RouteContext<"/api/custom-exams/[id]">) => {
    const { id } = await context.params;
    assertId(id);
    const user = await requireUser();

    if (!(await deleteCustomExam(id, user._id))) {
      throw new AppError("Exam not found", HttpStatusCode.NOT_FOUND);
    }

    return Response.json(
      ApiResponse.ok<DeleteCustomExamResponse>({ id }, "Exam deleted"),
      { status: HttpStatusCode.OK },
    );
  },
);
