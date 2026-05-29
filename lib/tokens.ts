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
 * Stores only the SHA-256 hash. Expires in 15 minutes.
 */
export async function generateEmailVerificationToken(identifier: string) {
  const token = generateSecureToken();
  const hashed = hashToken(token);
  const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  // Delete existing verification tokens for this identifier AND all expired tokens database-wide to avoid bloat
  await db.verificationToken.deleteMany({
    where: {
      OR: [
        { identifier },
        { expires: { lt: new Date() } }
      ]
    },
  });

  const emailVerificationToken = await db.verificationToken.create({
    data: {
      identifier,
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
export async function generatePasswordResetToken(email: string) {
  const token = generateSecureToken();
  const hashed = hashToken(token);
  const expires = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour

  // Delete existing reset tokens for this email AND all expired tokens database-wide to avoid bloat
  await db.passwordResetToken.deleteMany({
    where: {
      OR: [
        { email },
        { expires: { lt: new Date() } }
      ]
    },
  });

  const passwordResetToken = await db.passwordResetToken.create({
    data: {
      email,
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
  const tokenEntry = await db.verificationToken.findUnique({
    where: { token: hashed },
  });

  if (!tokenEntry) return null;

  const hasExpired = new Date() > tokenEntry.expires;
  if (hasExpired) {
    await db.verificationToken.delete({ where: { token: tokenEntry.token } }).catch((err) => {
      console.error("[TOKENS] Failed to delete expired email verification token", err);
    });
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
    await db.passwordResetToken.delete({ where: { token: tokenEntry.token } }).catch((err) => {
      console.error("[TOKENS] Failed to delete expired password reset token", err);
    });
    return null;
  }

  return tokenEntry;
}
