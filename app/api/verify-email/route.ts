import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateEmailVerificationToken } from "@/lib/tokens";
import { sendEmail } from "@/lib/email";
import { WelcomeEmail } from "@/emails/WelcomeEmail";
import { ratelimit } from "@/lib/rate-limit";
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
  const limitRes = await ratelimit.limit(`verify:${ip}`);
  if (!limitRes.success) {
    return NextResponse.json(
      { message: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    if (!body || typeof body !== "object" || !body.token) {
      return NextResponse.json({ message: "Token is required" }, { status: 400 });
    }
    const token = String(body.token);

    // Validate email verification token
    const tokenEntry = await validateEmailVerificationToken(token);
    if (!tokenEntry) {
      return NextResponse.json(
        { message: "Invalid or expired verification token." },
        { status: 400 }
      );
    }

    // Fetch user details before mutations
    const user = await db.user.findUnique({
      where: { email: tokenEntry.identifier },
    });

    // Mark user email as verified
    await db.user.update({
      where: { email: tokenEntry.identifier },
      data: {
        emailVerified: new Date(),
      },
    });

    // Send welcome email BEFORE deleting token (if welcome email fails, token still exists for retry)
    if (user) {
      const loginUrl = `${process.env.NEXTAUTH_URL}/auth?mode=login`;
      try {
        await sendEmail({
          to: user.email,
          subject: "Welcome to SecureGate!",
          template: React.createElement(WelcomeEmail, {
            name: user.name || "User",
            loginUrl,
          }),
        });
      } catch (emailErr) {
        console.error("[VERIFY_EMAIL] Welcome email failed, but verification succeeded", emailErr);
      }
    }

    // Delete token after side-effects succeed (replay attack mitigation)
    await db.emailVerificationToken.delete({
      where: { token: tokenEntry.token },
    }).catch((err) => {
      console.error("[VERIFY_EMAIL] Failed to delete token", err);
    });

    return NextResponse.json({ message: "Email verified successfully." });
  } catch (error) {
    console.error("[VERIFY_EMAIL_UNEXPECTED_ERROR]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
