import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import type mongoose from "mongoose";
import { Session } from "@/models/session";
import bcrypt from "bcrypt";
import { User } from "@/models/user";

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

/**
 * Resolves the session cookie to its live Session row, or null when the
 * cookie is missing, unknown or expired. Expects an open DB connection.
 */
export async function getSession() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  // The TTL sweep can lag by about a minute, so check expiresAt here too.
  return Session.findOne({
    tokenHash: hashSessionToken(token),
    expiresAt: { $gt: new Date() },
  });
}

/**
 * Deletes the Session row behind the cookie and clears the cookie. Safe to call
 * when there is no session. Expects an open DB connection.
 */
export async function deleteSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    await Session.deleteOne({ tokenHash: hashSessionToken(token) });
  }
  cookieStore.delete(SESSION_COOKIE);
}

// Cost factor: each +1 doubles hashing time. 12 is ~250ms on typical servers.
const SALT_ROUNDS = 12;

/** Returns a bcrypt hash (salt embedded) for storing in User.passwordHash. */
export async function hashPassword(password: string) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, stored: string) {
  return bcrypt.compare(password, stored);
}

export async function verifySessionToken(token: string) {
  const session = await Session.findOne({
    tokenHash: hashSessionToken(token),
    expiresAt: { $gt: new Date() },
  });
  return session || null;
}

export async function verifySessionAndGetUser(
  token: string | null | undefined,
) {
  if (!token) return null;

  const session = await verifySessionToken(token);
  if (!session) return null;

  const user = await User.findById(session.userId);
  return user || null;
}
