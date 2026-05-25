import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
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

    // Mark user email as verified and delete token in an atomic transaction (replay protection)
    await db.$transaction([
      db.user.update({
        where: { email: tokenEntry.identifier },
        data: {
          emailVerified: new Date(),
        },
      }),
      db.emailVerificationToken.delete({
        where: { token: tokenEntry.token },
      }),
    ]);

    // Send welcome email after verification transaction completes
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

    return NextResponse.json({ message: "Email verified successfully." });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return NextResponse.json({ message: "User not found or token already used." }, { status: 400 });
      }
    }
    console.error("[VERIFY_EMAIL_UNEXPECTED_ERROR]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
