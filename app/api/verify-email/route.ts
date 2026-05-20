import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateEmailVerificationToken } from "@/lib/tokens";
import { sendEmail } from "@/lib/email";
import { WelcomeEmail } from "@/emails/WelcomeEmail";
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
  const limitRes = await ratelimit.limit(`verify:${ip}`);
  if (!limitRes.success) {
    return NextResponse.json(
      { message: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ message: "Token is required" }, { status: 400 });
    }

    // Validate email verification token
    const tokenEntry = await validateEmailVerificationToken(token);
    if (!tokenEntry) {
      return NextResponse.json(
        { message: "Invalid or expired verification token." },
        { status: 400 }
      );
    }

    // Mark user email as verified
    await db.user.update({
      where: { email: tokenEntry.identifier },
      data: {
        emailVerified: new Date(),
      },
    });

    // Delete token immediately to prevent reuse (replay attack mitigation)
    await db.emailVerificationToken.delete({
      where: { token: tokenEntry.token },
    }).catch(() => {});

    // Fetch user details to send Welcome email
    const user = await db.user.findUnique({
      where: { email: tokenEntry.identifier },
    });

    if (user) {
      const loginUrl = `${process.env.NEXTAUTH_URL}/login`;
      await sendEmail({
        to: user.email,
        subject: "Welcome to SecureGate!",
        template: React.createElement(WelcomeEmail, {
          name: user.name || "User",
          loginUrl,
        }),
      });
    }

    return NextResponse.json({ message: "Email verified successfully." });
  } catch (error) {
    console.error("[VERIFY_EMAIL_UNEXPECTED_ERROR]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
