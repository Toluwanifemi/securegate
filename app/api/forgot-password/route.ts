import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ForgotPasswordSchema } from "@/lib/validations/auth";
import { generatePasswordResetToken } from "@/lib/tokens";
import { sendEmail } from "@/lib/email";
import { PasswordResetEmail } from "@/emails/PasswordResetEmail";
import { ratelimit } from "@/lib/rate-limit";
import { validateCsrf } from "@/lib/csrf";
import * as React from "react";

export async function POST(req: Request) {
  // CSRF protection
  if (!validateCsrf(req)) {
    return NextResponse.json({ message: "Invalid request origin" }, { status: 403 });
  }

  // Rate limiting check
  const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
  const limitRes = await ratelimit.limit(`forgot-password:${ip}`);
  if (!limitRes.success) {
    return NextResponse.json(
      { message: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const result = ForgotPasswordSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { message: "Invalid email address", errors: result.error.format() },
        { status: 400 }
      );
    }

    const { email } = result.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Look up the user
    const user = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    // Return the exact same response regardless of existence to prevent enumeration (OWASP)
    if (!user) {
      return NextResponse.json({
        message: "If an account exists for this email, a reset link has been sent.",
      });
    }

    // Generate secure password reset token
    const token = await generatePasswordResetToken(user.email);
    const resetUrl = `${process.env.NEXTAUTH_URL}/forgot-password/reset?token=${token.token}`;

    // Send reset email
    await sendEmail({
      to: user.email,
      subject: "Reset your SecureGate password",
      template: React.createElement(PasswordResetEmail, {
        name: user.name || "User",
        resetUrl,
      }),
    });

    return NextResponse.json({
      message: "If an account exists for this email, a reset link has been sent.",
    });
  } catch (error) {
    console.error("[FORGOT_PASSWORD_UNEXPECTED_ERROR]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
