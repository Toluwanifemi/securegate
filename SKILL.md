# Skill: Resend Integration

## Purpose

This skill covers everything needed to send transactional emails in SecureGate
using [Resend](https://resend.com) and [React Email](https://react.email).
Use it whenever you need to send a verification email, password reset email,
or any other automated email.

---

## Setup Checklist

Before sending any email, verify the following:

- [ ] `RESEND_API_KEY` is set in `.env.local`
- [ ] `EMAIL_FROM` is set to a verified sender (e.g. `noreply@yourdomain.com`)
- [ ] The `resend` and `@react-email/components` packages are installed
- [ ] The email template exists in `emails/`

---

## Package Installation

```bash
npm install resend @react-email/components
```

---

## Core Helper: `lib/email.ts`

This is the single entry point for all email sending. Never call the Resend SDK
directly from routes or server actions — always go through this helper.

```ts
import { Resend } from "resend";
import type { ReactElement } from "react";

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendEmailOptions {
  to: string;
  subject: string;
  template: ReactElement;
}

interface SendEmailResult {
  success: boolean;
  error?: string;
}

/**
 * Sends a transactional email via Resend.
 * Always use this function — never call the Resend SDK directly from routes.
 */
export async function sendEmail({
  to,
  subject,
  template,
}: SendEmailOptions): Promise<SendEmailResult> {
  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to,
      subject,
      react: template,
    });
    return { success: true };
  } catch (error) {
    console.error("[RESEND_ERROR]", error);
    return { success: false, error: "Failed to send email" };
  }
}
```

---

## Email Templates

All templates live in `emails/`. Each is a React component that accepts typed props.

### Verification Email — `emails/VerificationEmail.tsx`

```tsx
import {
  Body, Button, Container, Head, Heading,
  Html, Preview, Section, Text,
} from "@react-email/components";

interface VerificationEmailProps {
  name: string;
  verificationUrl: string;
}

export function VerificationEmail({ name, verificationUrl }: VerificationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Verify your SecureGate email address</Preview>
      <Body style={{ backgroundColor: "#ffffff", fontFamily: "sans-serif" }}>
        <Container style={{ maxWidth: "480px", margin: "0 auto", padding: "32px" }}>
          <Heading style={{ fontSize: "20px", color: "#111111" }}>
            Verify your email
          </Heading>
          <Text style={{ color: "#555555" }}>
            Hi {name}, click the button below to verify your account.
            This link expires in 24 hours.
          </Text>
          <Section style={{ marginTop: "24px" }}>
            <Button
              href={verificationUrl}
              style={{
                backgroundColor: "#1a1a2e",
                color: "#ffffff",
                padding: "12px 24px",
                borderRadius: "4px",
                textDecoration: "none",
              }}
            >
              Verify email address
            </Button>
          </Section>
          <Text style={{ color: "#999999", fontSize: "12px", marginTop: "24px" }}>
            If you did not create an account, you can safely ignore this email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
```

### Password Reset Email — `emails/PasswordResetEmail.tsx`

```tsx
import {
  Body, Button, Container, Head, Heading,
  Html, Preview, Section, Text,
} from "@react-email/components";

interface PasswordResetEmailProps {
  name: string;
  resetUrl: string;
}

export function PasswordResetEmail({ name, resetUrl }: PasswordResetEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Reset your SecureGate password</Preview>
      <Body style={{ backgroundColor: "#ffffff", fontFamily: "sans-serif" }}>
        <Container style={{ maxWidth: "480px", margin: "0 auto", padding: "32px" }}>
          <Heading style={{ fontSize: "20px", color: "#111111" }}>
            Reset your password
          </Heading>
          <Text style={{ color: "#555555" }}>
            Hi {name}, we received a request to reset your password.
            This link expires in 1 hour.
          </Text>
          <Section style={{ marginTop: "24px" }}>
            <Button
              href={resetUrl}
              style={{
                backgroundColor: "#1a1a2e",
                color: "#ffffff",
                padding: "12px 24px",
                borderRadius: "4px",
                textDecoration: "none",
              }}
            >
              Reset password
            </Button>
          </Section>
          <Text style={{ color: "#999999", fontSize: "12px", marginTop: "24px" }}>
            If you did not request this, you can safely ignore this email.
            Your password will not change.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
```

---

## Sending an Email from a Route

```ts
// app/api/verify-email/route.ts (example usage)
import { sendEmail } from "@/lib/email";
import { VerificationEmail } from "@/emails/VerificationEmail";

const result = await sendEmail({
  to: user.email,
  subject: "Verify your SecureGate account",
  template: <VerificationEmail name={user.name} verificationUrl={url} />,
});

if (!result.success) {
  return NextResponse.json({ error: "Failed to send verification email" }, { status: 500 });
}
```

---

## Webhook Handling

Resend can send webhook events for delivery tracking (delivered, bounced, complained).
See `skills/resend-integration/resources/webhook-handler.ts` for the full implementation.

Key points:
- Webhook endpoint: `POST /api/webhooks/resend`
- Verify the `svix-signature` header on every incoming request
- Log delivery failures and bounces — do not retry automatically

---

## Environment Variables

| Variable       | Description                               |
|----------------|-------------------------------------------|
| `RESEND_API_KEY` | Found in your Resend dashboard          |
| `EMAIL_FROM`   | Must be a verified sender in Resend       |

---

## Testing Emails Locally

Use Resend's test mode or the React Email dev server:

```bash
npx react-email dev
```

This previews all templates in `emails/` at `http://localhost:3000`.

---

## Common Errors

| Error                          | Fix                                             |
|--------------------------------|-------------------------------------------------|
| `401 Unauthorized`             | Check `RESEND_API_KEY` is set correctly         |
| `422 Unprocessable Entity`     | The `from` address is not verified in Resend    |
| `Template renders blank email` | Check that props are passed correctly           |
| `RESEND_API_KEY is undefined`  | `.env.local` not loaded — restart the dev server |
