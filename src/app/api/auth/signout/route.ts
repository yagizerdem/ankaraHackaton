import dbConnect from "@/lib/db";
import { withErrorHandler } from "@/error/with-error-handler";
import { ApiResponse } from "@/lib/api-response";
import HttpStatusCode from "@/lib/http-status-code";
import { deleteSession } from "@/lib/session";

/**
 * Ends the current session. Always 200, so signing out twice or without a
 * cookie is not an error for the client.
 */
export const POST = withErrorHandler(async () => {
  await dbConnect();
  await deleteSession();

  return Response.json(ApiResponse.ok(undefined, "Signed out"), {
    status: HttpStatusCode.OK,
  });
});
