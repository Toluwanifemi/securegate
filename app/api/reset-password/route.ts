import { NextResponse } from "next/server";
import bcryptjs from "bcryptjs";
import { db } from "@/lib/db";
import { ResetPasswordSchema } from "@/lib/validations/auth";
import { validatePasswordResetToken } from "@/lib/tokens";
import { ratelimit } from "@/lib/rate-limit";
import { validateCsrf } from "@/lib/csrf";

export async function POST(req: Request) {
  // CSRF protection
  if (!validateCsrf(req)) {
    return NextResponse.json({ message: "Invalid request origin" }, { status: 403 });
  }

  // Rate limiting check
  const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
  const limitRes = await ratelimit.limit(`reset-password:${ip}`);
  if (!limitRes.success) {
    return NextResponse.json(
      { message: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  try {
    const { token, password, confirmPassword } = await req.json();

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

    // Hash new password with 12 salt rounds
    const hashedPassword = await bcryptjs.hash(password, 12);

    // Update user password
    await db.user.update({
      where: { email: tokenEntry.email },
      data: {
        password: hashedPassword,
      },
    });

    // Delete reset token immediately to prevent reuse (replay attack mitigation)
    await db.passwordResetToken.delete({
      where: { token: tokenEntry.token },
    }).catch(() => {});

    return NextResponse.json({ message: "Password reset completed successfully." });
  } catch (error) {
    console.error("[RESET_PASSWORD_UNEXPECTED_ERROR]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
