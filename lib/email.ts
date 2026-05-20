import { Resend } from "resend";
import type { ReactElement } from "react";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

interface SendEmailOptions {
  to: string;
  subject: string;
  template: ReactElement;
  /** Optional. Pass a stable key (e.g. `verify:${userId}`) to safely retry
   *  without sending duplicate emails. Expires after 24 hours. */
  idempotencyKey?: string;
}

interface SendEmailResult {
  success: boolean;
  /** Resend's email ID — store this if you need delivery tracking later. */
  emailId?: string;
  error?: string;
}

/**
 * Sends a transactional email via the Resend API.
 * This is the single entry point for all email sending in SecureGate.
 */
export async function sendEmail({
  to,
  subject,
  template,
  idempotencyKey,
}: SendEmailOptions): Promise<SendEmailResult> {
  const fromEmail = process.env.EMAIL_FROM;

  if (!fromEmail) {
    console.error("[EMAIL] EMAIL_FROM is not set");
    return { success: false, error: "Email service is not configured" };
  }

  // Development fallback when API Key is missing
  if (!process.env.RESEND_API_KEY || !resend) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[EMAIL_FALLBACK] RESEND_API_KEY is not set. Logging email details to console:");
      console.warn(`----------------------------------------`);
      console.warn(`From:    ${fromEmail}`);
      console.warn(`To:      ${to}`);
      console.warn(`Subject: ${subject}`);
      console.warn(`Please check the react email props or template for details.`);
      console.warn(`----------------------------------------`);
      return { success: true, emailId: "mock-dev-email-id" };
    }
    console.error("[EMAIL] RESEND_API_KEY is not set");
    return { success: false, error: "Email service is not configured" };
  }

  try {
    const sendOptions = {
      from: fromEmail,
      to,
      subject,
      react: template,
    };

    // Pass idempotency key as a header if provided
    const requestOptions = idempotencyKey
      ? { headers: { "Idempotency-Key": idempotencyKey } }
      : undefined;

    const { data, error } = await resend.emails.send(sendOptions, requestOptions);

    if (error) {
      // Log the structured Resend error for internal diagnosis
      console.error("[EMAIL_ERROR]", { type: error.name, message: error.message });
      return { success: false, error: "Failed to send email" };
    }

    return { success: true, emailId: data?.id };
  } catch (err) {
    console.error("[EMAIL_UNEXPECTED_ERROR]", err);
    return { success: false, error: "Failed to send email" };
  }
}
