import { cookies } from "next/headers";

import { AppError } from "@/error/app-error";
import { SESSION_COOKIE, verifySessionAndGetUser } from "@/lib/auth";
import dbConnect from "@/lib/db";
import HttpStatusCode from "@/lib/http-status-code";
import { zodErrorToFromErrors } from "@/lib/utils";

import type * as z from "zod";

/** The signed-in user for a route handler, or a 401 AppError. */
export async function requireUser() {
  await dbConnect();
  const user = await verifySessionAndGetUser(
    (await cookies()).get(SESSION_COOKIE)?.value,
  );
  if (!user) throw new AppError("Sign in required", HttpStatusCode.UNAUTHORIZED);
  return user;
}

/** Parses a body with a zod schema, or throws a 400 with field errors. */
export function parseOrThrow<T extends z.ZodType>(schema: T, body: unknown): z.infer<T> {
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw new AppError(
      "Validation failed",
      HttpStatusCode.BAD_REQUEST,
      true,
      zodErrorToFromErrors(parsed.error),
    );
  }
  return parsed.data;
}
