import crypto from "crypto";
import bcryptjs from "bcryptjs";

export function sha256(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export async function hashPassword(password: string): Promise<string> {
  return bcryptjs.hash(sha256(password), 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcryptjs.compare(sha256(password), hash);
}
