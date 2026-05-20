# Skill: Nodemailer Integration

## What This Skill Covers

This skill covers every email sending concern in SecureGate using Nodemailer
with SMTP:

- Email verification on sign up
- Password reset link delivery
- The `lib/email.ts` helper — the single entry point for all sends
- React Email templates for each flow
- SMTP configuration and setup
- Local development options

---

## Environment Variables

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your@email.com
SMTP_PASS=your-app-password
EMAIL_FROM=SecureGate <noreply@yourdomain.com>
```

### Common SMTP Providers

| Provider     | Host                   | Port | Secure |
|--------------|------------------------|------|--------|
| Gmail        | smtp.gmail.com         | 587  | false  |
| Outlook      | smtp.office365.com     | 587  | false  |
| Mailtrap (dev) | sandbox.smtp.mailtrap.io | 2525 | false |
| SendGrid     | smtp.sendgrid.net      | 587  | false  |

> **Gmail note:** Use an [App Password](https://support.google.com/accounts/answer/185833)
> — not your regular password. Requires 2FA enabled on the account.

---

## Core Helper: `lib/email.ts`

This is the **only** file in the codebase that imports from `nodemailer`.
All routes and server actions send email through this helper.

```ts
import nodemailer from "nodemailer";
import { renderToString } from "react-dom/server";
import type { ReactElement } from "react";

// Development fallback: logs to console when SMTP is not configured
export async function sendEmail({
  to,
  subject,
  template,
}: {
  to: string;
  subject: string;
  template: ReactElement;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!process.env.SMTP_HOST || !process.env.EMAIL_FROM) {
    console.warn("[EMAIL] SMTP not configured — logging to console");
    console.log(`[EMAIL] To: ${to}, Subject: ${subject}`);
    return { success: true };
  }
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    const html = renderToString(template);
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
    });
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error("[EMAIL_ERROR]", err);
    return { success: false, error: "Failed to send email" };
  }
}
```

---

## React Email Templates

All templates live in `emails/`. They use `@react-email/components` for
rendering. The `sendEmail` helper converts them to HTML via `renderToString`.

Available templates:
- `VerificationEmail.tsx` — sent after sign up (24h token expiry)
- `WelcomeEmail.tsx` — sent after email verification
- `PasswordResetEmail.tsx` — sent on forgot password request (1h token expiry)

All styling must be inlined — email clients do not support CSS custom properties
or external stylesheets.

---

## Usage in Routes

```ts
// app/api/register/route.ts (after user is created and token is generated)
import { sendEmail } from "@/lib/email";
import { VerificationEmail } from "@/emails/VerificationEmail";
import * as React from "react";

const verificationUrl = `${process.env.NEXTAUTH_URL}/verify-email?token=${plainToken}`;

await sendEmail({
  to: user.email,
  subject: "Verify your SecureGate account",
  template: React.createElement(VerificationEmail, {
    name: user.name, verificationUrl,
  }),
});
```

Always use the same pattern:
- Import `sendEmail` from `@/lib/email`
- Import the template component from `@/emails/<TemplateName>`
- Use `React.createElement` to pass props
- Handle failure gracefully — never block the main flow if email fails

---

## Local Development

### Option 1 — Mailtrap (recommended)

1. Create a free account at mailtrap.io
2. Copy the SMTP credentials for "Email Testing" → "Inbox"
3. Set them in `.env`:
   ```
   SMTP_HOST=sandbox.smtp.mailtrap.io
   SMTP_PORT=2525
   SMTP_USER=your-mailtrap-user
   SMTP_PASS=your-mailtrap-pass
   ```
4. Emails appear in the Mailtrap inbox — never sent to real recipients

### Option 2 — Log to Console

If no SMTP config is set, `sendEmail` logs the recipient and subject to the
console without sending. No server needed.

### Option 3 — Real SMTP (Gmail/Outlook)

Set your real SMTP credentials. For Gmail, generate an App Password via
Google Account → Security → 2-Step Verification → App Passwords.

---

## Pre-Deployment Checklist

- [ ] SMTP credentials set in production environment variables (not just `.env`)
- [ ] `EMAIL_FROM` uses a valid sender address for the SMTP provider
- [ ] All templates render correctly via `renderToString`
- [ ] Verification URL uses `NEXTAUTH_URL`, not `localhost`
- [ ] Reset URL uses `NEXTAUTH_URL`, not `localhost`
- [ ] Failed email sends do not block account creation or forgot-password responses
- [ ] No Nodemailer error objects are returned to the client
