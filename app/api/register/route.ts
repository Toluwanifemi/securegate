import { NextResponse } from "next/server";
import bcryptjs from "bcryptjs";
import { db } from "@/lib/db";
import { SignUpSchema } from "@/lib/validations/auth";
import { generateEmailVerificationToken } from "@/lib/tokens";
import { sendEmail } from "@/lib/email";
import { VerificationEmail } from "@/emails/VerificationEmail";
import { ratelimit } from "@/lib/rate-limit";
import { validateCsrf } from "@/lib/csrf";
import * as React from "react";

export async function POST(req: Request) {
  // CSRF protection
  if (!validateCsrf(req)) {
    return NextResponse.json({ message: "Invalid request origin" }, { status: 403 });
  }

  // Rate limiting check based on client IP
  const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
  const limitRes = await ratelimit.limit(`register:${ip}`);
  if (!limitRes.success) {
    return NextResponse.json(
      { message: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const result = SignUpSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { message: "Invalid input data", errors: result.error.format() },
        { status: 400 }
      );
    }

    const { name, email, password } = result.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      // If user exists and is not verified, silently trigger a new verification email
      if (!existingUser.emailVerified) {
        const token = await generateEmailVerificationToken(existingUser.email);
        const verificationUrl = `${process.env.NEXTAUTH_URL}/verify-email?token=${token.token}`;
        
        await sendEmail({
          to: normalizedEmail,
          subject: "Verify your SecureGate account",
          template: React.createElement(VerificationEmail, {
            name: existingUser.name || name,
            verificationUrl,
          }),
        });
      }

      // Return generic success to prevent email enumeration (OWASP)
      return NextResponse.json({
        message: "Registration completed. If your email is valid, a verification link has been sent.",
      });
    }

    // Hash password with 12 salt rounds
    const hashedPassword = await bcryptjs.hash(password, 12);

    // Create user in database
    const newUser = await db.user.create({
      data: {
        name,
        email: normalizedEmail,
        password: hashedPassword,
      },
    });

    // Generate email verification token
    const token = await generateEmailVerificationToken(newUser.email);
    const verificationUrl = `${process.env.NEXTAUTH_URL}/verify-email?token=${token.token}`;

    // Send verification email
    const emailResult = await sendEmail({
      to: newUser.email,
      subject: "Verify your SecureGate account",
      template: React.createElement(VerificationEmail, {
        name: newUser.name || "User",
        verificationUrl,
      }),
    });

    if (!emailResult.success) {
      console.warn(`[REGISTER] Verification email failed to send for user ${newUser.id}`);
    }

    return NextResponse.json({
      message: "Registration completed. If your email is valid, a verification link has been sent.",
    });
  } catch (error) {
    console.error("[REGISTER_UNEXPECTED_ERROR]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
