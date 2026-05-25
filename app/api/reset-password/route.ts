import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { ResetPasswordSchema } from "@/lib/validations/auth";
import { validatePasswordResetToken } from "@/lib/tokens";
import { ratelimit } from "@/lib/rate-limit";
import { validateCsrf } from "@/lib/csrf";
import { hashPassword } from "@/lib/password-hash";
import { getClientIp } from "@/lib/ip";

export async function POST(req: Request) {
  // CSRF protection
  if (!validateCsrf(req)) {
    return NextResponse.json({ message: "Invalid request origin" }, { status: 403 });
  }

  // Rate limiting check
  const ip = getClientIp(req);
  const limitRes = await ratelimit.limit(`reset-password:${ip}`);
  if (!limitRes.success) {
    return NextResponse.json(
      { message: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    if (!body || typeof body !== "object") {
      return NextResponse.json({ message: "Invalid request body" }, { status: 400 });
    }
    const { token, password, confirmPassword } = body;

    if (!token) {
      return NextResponse.json({ message: "Token is required" }, { status: 400 });
    }

    // Validate inputs locally using Zod
    const result = ResetPasswordSchema.safeParse({ password, confirmPassword });
    if (!result.success) {
      return NextResponse.json(
        { message: "Invalid input data", errors: result.error.format() },
        { status: 400 }
      );
    }

    // Validate password reset token
    const tokenEntry = await validatePasswordResetToken(token);
    if (!tokenEntry) {
      return NextResponse.json(
        { message: "Invalid or expired password reset link." },
        { status: 400 }
      );
    }

    // Hash new password with SHA-256 pre-hash + bcrypt (eliminates 72-byte truncation)
    const hashedPassword = await hashPassword(password);

    // Update user password and delete reset token in an atomic transaction (replay protection)
    await db.$transaction([
      db.user.update({
        where: { email: tokenEntry.email },
        data: {
          password: hashedPassword,
        },
      }),
      db.passwordResetToken.delete({
        where: { token: tokenEntry.token },
      }),
    ]);

    return NextResponse.json({ message: "Password reset completed successfully." });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return NextResponse.json({ message: "User not found or token already used." }, { status: 400 });
      }
    }
    console.error("[RESET_PASSWORD_UNEXPECTED_ERROR]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
