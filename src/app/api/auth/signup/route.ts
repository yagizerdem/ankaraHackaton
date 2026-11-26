import dbConnect from "@/lib/db";
import { User } from "@/models/user";
import { createSignUpSchema, type SignUpResponse } from "@/domain/auth";
import { withErrorHandler } from "@/error/with-error-handler";
import { ApiResponse } from "@/lib/api-response";
import HttpStatusCode from "@/lib/http-status-code";
import { hashPassword } from "@/lib/auth";
import { zodErrorToFromErrors } from "@/lib/utils";

/** JSON body matching createSignUpSchema. */
export const POST = withErrorHandler(async (request: Request) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(ApiResponse.badRequest("Expected a JSON body"), {
      status: HttpStatusCode.BAD_REQUEST,
    });
  }

  const result = createSignUpSchema(body).safeParse(body);
  if (!result.success) {
    return Response.json(
      ApiResponse.badRequest(
        "Validation failed",
        zodErrorToFromErrors(result.error),
      ),
      { status: HttpStatusCode.BAD_REQUEST },
    );
  }

  const { password, ...profile } = result.data;

  await dbConnect();
  // A taken email or username fails the unique index; withErrorHandler turns
  // that duplicate-key error into a 409 with the field in fromErrors.
  const user = await User.create({
    ...profile,
    passwordHash: await hashPassword(password),
  });

  return Response.json(
    ApiResponse.created<SignUpResponse>(
      {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        firstName: user.firstName ?? undefined,
        lastName: user.lastName ?? undefined,
        createdAt: user.createdAt,
      },
      "User created",
    ),
    { status: HttpStatusCode.CREATED },
  );
});
