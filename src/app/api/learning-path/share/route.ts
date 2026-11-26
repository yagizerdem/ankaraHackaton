import { randomBytes } from "node:crypto";

import { createGraphRequestSchema } from "@/domain/learning-path";
import { withErrorHandler } from "@/error/with-error-handler";
import { loadGraph } from "@/lib/assessment/service";
import { ApiResponse } from "@/lib/api-response";
import { hashSessionToken } from "@/lib/auth";
import HttpStatusCode from "@/lib/http-status-code";
import { parseOrThrow, requireUser } from "@/lib/learning/require-user";
import { getJsonBody } from "@/lib/utils";
import { ShareLink } from "@/models/share-link";

import type { ShareResponse } from "@/domain/learning-path";

const LINK_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000;

/** Creates a read-only report link for the student's teacher (30 days). */
export const POST = withErrorHandler(async (request: Request) => {
  const user = await requireUser();
  const { graphId } = parseOrThrow(createGraphRequestSchema(), await getJsonBody(request));

  const context = await loadGraph(graphId, user._id);

  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + LINK_LIFETIME_MS);
  await ShareLink.create({
    userId: user._id,
    graphId: context.graph._id,
    tokenHash: hashSessionToken(token),
    expiresAt,
  });

  return Response.json(
    ApiResponse.created<ShareResponse>(
      { token, expiresAt: expiresAt.toISOString() },
      "Link created",
    ),
    { status: HttpStatusCode.CREATED },
  );
});
