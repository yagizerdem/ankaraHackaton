import dbConnect from "@/lib/db";
import { withErrorHandler } from "@/error/with-error-handler";
import { ApiResponse } from "@/lib/api-response";
import HttpStatusCode from "@/lib/http-status-code";
import { getSession } from "@/lib/auth";
import { User } from "@/models/user";
import type { MeResponse } from "@/domain/auth";

/** The signed-in user for the session cookie, or 401. */
export const GET = withErrorHandler(async () => {
  await dbConnect();

  const session = await getSession();
  if (!session) {
    return Response.json(ApiResponse.unauthorized("Not signed in"), {
      status: HttpStatusCode.UNAUTHORIZED,
    });
  }

  // The session can outlive its user if the account was deleted.
  const user = await User.findById(session.userId);
  if (!user) {
    return Response.json(ApiResponse.unauthorized("Not signed in"), {
      status: HttpStatusCode.UNAUTHORIZED,
    });
  }

  return Response.json(
    ApiResponse.ok<MeResponse>(
      {
        user: {
          id: user._id.toString(),
          username: user.username,
          email: user.email,
          firstName: user.firstName ?? undefined,
          lastName: user.lastName ?? undefined,
          createdAt: user.createdAt,
        },
        expiresAt: session.expiresAt,
      },
      "OK",
    ),
    { status: HttpStatusCode.OK, headers: { "Cache-Control": "no-store" } },
  );
});
