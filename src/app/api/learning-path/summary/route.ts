import { createGraphRequestSchema } from "@/domain/learning-path";
import { AppError } from "@/error/app-error";
import { withErrorHandler } from "@/error/with-error-handler";
import { ApiResponse } from "@/lib/api-response";
import HttpStatusCode from "@/lib/http-status-code";
import { getLearningReport } from "@/lib/learning/report";
import { parseOrThrow, requireUser } from "@/lib/learning/require-user";
import { writeWeeklySummary } from "@/lib/learning/weekly-summary";
import { getJsonBody } from "@/lib/utils";
import { WeeklySummary } from "@/models/weekly-summary";

import type { SummaryResponse } from "@/domain/learning-path";

export const maxDuration = 60;

/** Writes a new weekly note from the student's numbers and stores it. */
export const POST = withErrorHandler(async (request: Request) => {
  const user = await requireUser();
  const { graphId } = parseOrThrow(createGraphRequestSchema(), await getJsonBody(request));

  const report = await getLearningReport(user._id, graphId);

  let written: Awaited<ReturnType<typeof writeWeeklySummary>>;
  try {
    written = await writeWeeklySummary(
      report.studentName,
      report.documentName,
      report.weekly,
      request.signal,
    );
  } catch (error) {
    console.error(error);
    throw new AppError("Couldn't write the summary; try again", HttpStatusCode.BAD_GATEWAY);
  }

  const summary = await WeeklySummary.create({
    userId: user._id,
    graphId: report.graphId,
    text: written.text,
    stats: report.weekly,
    generationModel: written.model,
  });

  return Response.json(
    ApiResponse.created<SummaryResponse>(
      { text: summary.text, createdAt: summary.createdAt.toISOString() },
      "Summary written",
    ),
    { status: HttpStatusCode.CREATED },
  );
});
