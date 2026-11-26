import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import type mongoose from "mongoose";
import { Session } from "@/models/session";

export const SESSION_COOKIE = "session";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** Only this hash is stored; a leaked sessions collection can't be replayed. */
export const hashSessionToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");

/**
 * Creates a Session row for the user and sets the raw token as an httpOnly
 * cookie. Call only from a Route Handler or Server Function.
 */
export async function createSession(
  userId: mongoose.Types.ObjectId,
  meta: { userAgent?: string; ip?: string } = {},
) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  const session = await Session.create({
    userId,
    tokenHash: hashSessionToken(token),
    expiresAt,
    userAgent: meta.userAgent,
    ip: meta.ip,
  });

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });

  return session;
}
