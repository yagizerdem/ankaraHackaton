import bcrypt from "bcrypt";

// Cost factor: each +1 doubles hashing time. 12 is ~250ms on typical servers.
const SALT_ROUNDS = 12;

/** Returns a bcrypt hash (salt embedded) for storing in User.passwordHash. */
export async function hashPassword(password: string) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, stored: string) {
  return bcrypt.compare(password, stored);
}
