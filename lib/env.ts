const requiredEnvVars = [
  "DATABASE_URL",
  "NEXTAUTH_SECRET",
  "NEXTAUTH_URL",
] as const;



export function validateEnv(): void {
  if (typeof window !== "undefined") return;

  for (const key of requiredEnvVars) {
    if (!process.env[key]) {
      throw new Error(
        `Missing required environment variable: ${key}. ` +
        "Set it in your .env.local or environment configuration."
      );
    }
  }

  const url = process.env.NEXTAUTH_URL;
  if (url) {
    try {
      new URL(url);
    } catch {
      throw new Error(
        `Invalid NEXTAUTH_URL: "${url}". Must be a valid URL including protocol (e.g. http://localhost:3000).`
      );
    }
  }
}

export function isSmtpConfigured(): boolean {
  return !!(process.env.SMTP_HOST && process.env.EMAIL_FROM);
}
