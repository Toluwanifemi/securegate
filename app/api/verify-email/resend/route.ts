import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { generateEmailVerificationToken } from "@/lib/tokens";
import { sendEmail } from "@/lib/email";
import { VerificationEmail } from "@/emails/VerificationEmail";
import { verifyEmailRateLimit } from "@/lib/rate-limit";
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
  const limitRes = await verifyEmailRateLimit.limit(`resend-verify:${ip}`);
  if (!limitRes.success) {
    return NextResponse.json(
      { message: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    if (!body || typeof body !== "object" || !body.email) {
      return NextResponse.json({ message: "Email is required" }, { status: 400 });
    }
    const email = String(body.email);

    const normalizedEmail = email.toLowerCase().trim();

    const user = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    // If user doesn't exist, return generic success to mitigate enumeration
    if (!user) {
      return NextResponse.json({
        message: "If an account exists with this email, a verification link has been sent.",
      });
    }

    // If user is already verified, return generic success
    if (user.emailVerified) {
      return NextResponse.json({
        message: "If an account exists with this email, a verification link has been sent.",
      });
    }

    // Generate new email verification token
    const token = await generateEmailVerificationToken(user.email);
    const origin = req.headers.get("origin") || process.env.AUTH_URL || process.env.NEXTAUTH_URL;
    const verificationUrl = `${origin}/auth?mode=verify-email&token=${token.token}`;

    // Send verification email
    await sendEmail({
      to: user.email,
      subject: "Verify your SecureGate account",
      template: React.createElement(VerificationEmail, {
        name: user.name || "User",
        verificationUrl,
      }),
    });

    return NextResponse.json({
      message: "If an account exists with this email, a verification link has been sent.",
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json({
          message: "If an account exists with this email, a verification link has been sent.",
        });
      }
    }
    console.error("[RESEND_VERIFY_UNEXPECTED_ERROR]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
