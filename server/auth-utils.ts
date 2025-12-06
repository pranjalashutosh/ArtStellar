import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function sanitizeUser<T extends { password: string }>(
  user: T,
): Omit<T, "password"> {
  const { password, ...sanitized } = user;
  return sanitized;
}

