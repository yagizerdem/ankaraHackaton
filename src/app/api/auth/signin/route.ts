import dbConnect from "@/lib/db";
import { withErrorHandler } from "@/error/with-error-handler";
import { ApiResponse } from "@/lib/api-response";
import HttpStatusCode from "@/lib/http-status-code";
import { createSignInSchema, SignInResponse } from "@/domain/auth";
import { hashPassword, verifyPassword } from "@/lib/password";
import { createSession } from "@/lib/session";
import { User } from "@/models/user";
import { SessionDocument } from "@/models/session";
import { zodErrorToFromErrors } from "@/lib/utils";

/** JSON body `{ email, password }`; sets the session cookie on success. */
export const POST = withErrorHandler(async (request: Request) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(ApiResponse.badRequest("Expected a JSON body"), {
      status: HttpStatusCode.BAD_REQUEST,
    });
  }

  const parsed = createSignInSchema(body).safeParse(body);
  if (!parsed.success) {
    const formErrors = zodErrorToFromErrors(parsed.error);
    return Response.json(
      ApiResponse.badRequest("Validation failed", formErrors),
      { status: HttpStatusCode.BAD_REQUEST },
    );
  }
  const { email, password } = parsed.data;

  await dbConnect();
  const user = await User.findOne({ email: email.toLowerCase() }).select(
    "+passwordHash",
  );

  if (!user) {
    return Response.json(
      ApiResponse.unauthorized("Invalid email or password"),
      { status: HttpStatusCode.UNAUTHORIZED },
    );
  }

  const passwordMatches = await verifyPassword(password, user.passwordHash!);

  if (!user || !passwordMatches) {
    // Same message for both, so the endpoint can't be used to probe emails.
    return Response.json(
      ApiResponse.unauthorized("Invalid email or password"),
      { status: HttpStatusCode.UNAUTHORIZED },
    );
  }

  const session: SessionDocument = await createSession(user._id, {
    userAgent: request.headers.get("user-agent") ?? undefined,
    ip: request.headers.get("x-forwarded-for")?.split(",")[0].trim(),
  });

  return Response.json(
    ApiResponse.ok<SignInResponse>(
      {
        user: {
          id: user._id.toString(),
          username: user.username,
          email: user.email,
          firstName: user.firstName ?? "",
          lastName: user.lastName ?? "",
        },
        expiresAt: session.expiresAt,
      },
      "Signed in",
    ),
    { status: HttpStatusCode.OK },
  );
});
