import { db } from "./db";
import crypto from "crypto";

/**
 * Generates a random secure token.
 */
export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Hashes a token with SHA-256 before storing in the database.
 * The plain token is sent to the user; the DB stores only the hash.
 */
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Creates an email verification token for a user.
 * Stores only the SHA-256 hash. Expires in 24 hours.
 */
export async function generateEmailVerificationToken(userId: string) {
  const token = generateSecureToken();
  const hashed = hashToken(token);
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  // Delete existing verification tokens for this user to avoid database bloat
  await db.emailVerificationToken.deleteMany({
    where: { userId },
  });

  const emailVerificationToken = await db.emailVerificationToken.create({
    data: {
      userId,
      token: hashed,
      expires,
    },
  });

  // Return the plain token for the URL; the DB stores only the hash
  return { ...emailVerificationToken, token };
}

/**
 * Creates a password reset token for a user.
 * Stores only the SHA-256 hash. Expires in 1 hour.
 */
export async function generatePasswordResetToken(userId: string) {
  const token = generateSecureToken();
  const hashed = hashToken(token);
  const expires = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour

  // Delete existing reset tokens for this user
  await db.passwordResetToken.deleteMany({
    where: { userId },
  });

  const passwordResetToken = await db.passwordResetToken.create({
    data: {
      userId,
      token: hashed,
      expires,
    },
  });

  // Return the plain token for the URL; the DB stores only the hash
  return { ...passwordResetToken, token };
}

/**
 * Validates an email verification token by hashing the input and comparing
 * against the stored hash. If expired, cleans it up and returns null.
 */
export async function validateEmailVerificationToken(token: string) {
  const hashed = hashToken(token);
  const tokenEntry = await db.emailVerificationToken.findUnique({
    where: { token: hashed },
  });

  if (!tokenEntry) return null;

  const hasExpired = new Date() > tokenEntry.expires;
  if (hasExpired) {
    await db.emailVerificationToken.delete({ where: { id: tokenEntry.id } }).catch(() => {});
    return null;
  }

  return tokenEntry;
}

/**
 * Validates a password reset token by hashing the input and comparing
 * against the stored hash. If expired, cleans it up and returns null.
 */
export async function validatePasswordResetToken(token: string) {
  const hashed = hashToken(token);
  const tokenEntry = await db.passwordResetToken.findUnique({
    where: { token: hashed },
  });

  if (!tokenEntry) return null;

  const hasExpired = new Date() > tokenEntry.expires;
  if (hasExpired) {
    await db.passwordResetToken.delete({ where: { id: tokenEntry.id } }).catch(() => {});
    return null;
  }

  return tokenEntry;
}
