import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { ForgotPasswordSchema } from "@/lib/validations/auth";
import { generatePasswordResetToken, hashToken } from "@/lib/tokens";
import { sendEmail } from "@/lib/email";
import { PasswordResetEmail } from "@/emails/PasswordResetEmail";
import { forgotPasswordRateLimit } from "@/lib/rate-limit";
import { validateCsrf } from "@/lib/csrf";
import { getClientIp } from "@/lib/ip";
import * as React from "react";

export async function POST(req: Request) {
  // CSRF protection
  if (!validateCsrf(req)) {
    return NextResponse.json({ message: "Invalid request origin" }, { status: 403 });
  }

  // Rate limiting check
  const ip = getClientIp(req);
  const limitRes = await forgotPasswordRateLimit.limit(`forgot-password:${ip}`);
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

    // Look up the user
    const user = await db.user.findUnique({
      where: { email },
    });

    // Return the exact same response regardless of existence to prevent enumeration (OWASP)
    if (!user) {
      return NextResponse.json({
        message: "If an account exists for this email, a reset link has been sent.",
      });
    }

    // Generate secure password reset token
    const token = await generatePasswordResetToken(user.email);
    const resetUrl = `${process.env.AUTH_URL || process.env.NEXTAUTH_URL}/auth?mode=reset-password&token=${token.token}`;

    // Send reset email
    const emailResult = await sendEmail({
      to: user.email,
      subject: "Reset your SecureGate password",
      template: React.createElement(PasswordResetEmail, {
        name: user.name || "User",
        resetUrl,
      }),
    });

    if (!emailResult.success) {
      await db.passwordResetToken.delete({
        where: { token: hashToken(token.token) },
      }).catch((err) => {
        console.error("[FORGOT_PASSWORD] Failed to clean up token after email failure", err);
      });
    }

    return NextResponse.json({
      message: "If an account exists for this email, a reset link has been sent.",
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json({
          message: "If an account exists for this email, a reset link has been sent.",
        });
      }
    }
    console.error("[FORGOT_PASSWORD_UNEXPECTED_ERROR]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
