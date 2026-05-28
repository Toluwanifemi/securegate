import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { SignUpSchema } from "@/lib/validations/auth";
import { generateEmailVerificationToken } from "@/lib/tokens";
import { sendEmail } from "@/lib/email";
import { VerificationEmail } from "@/emails/VerificationEmail";
import { ratelimit } from "@/lib/rate-limit";
import { validateCsrf } from "@/lib/csrf";
import { hashPassword } from "@/lib/password-hash";
import { getClientIp } from "@/lib/ip";
import * as React from "react";

export async function POST(req: Request) {
  // CSRF protection
  if (!validateCsrf(req)) {
    return NextResponse.json({ message: "Invalid request origin" }, { status: 403 });
  }

  // Rate limiting check based on client IP
  const ip = getClientIp(req);
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

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      // If user exists and is not verified, silently trigger a new verification email
      if (!existingUser.emailVerified) {
        const token = await generateEmailVerificationToken(existingUser.email);
        const verificationUrl = `${process.env.NEXTAUTH_URL}/auth?mode=verify-email&token=${token.token}`;
        
        await sendEmail({
          to: email,
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

    // Hash password with SHA-256 pre-hash + bcrypt (eliminates 72-byte truncation)
    const hashedPassword = await hashPassword(password);

    // Create user in database
    const newUser = await db.user.create({
      data: {
        name: name.trim(),
        email,
        password: hashedPassword,
      },
    });

    // Generate email verification token
    const token = await generateEmailVerificationToken(newUser.email);
    const verificationUrl = `${process.env.NEXTAUTH_URL}/auth?mode=verify-email&token=${token.token}`;

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
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        // Prevent email enumeration on race condition collisions
        return NextResponse.json({
          message: "Registration completed. If your email is valid, a verification link has been sent.",
        });
      }
    }
    console.error("[REGISTER_UNEXPECTED_ERROR]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
