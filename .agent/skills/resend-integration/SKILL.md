# Skill: Resend Integration


## What This Skill Covers

This skill covers every email sending concern in SecureGate:

- Email verification on sign up
- Password reset link delivery
- The `lib/email.ts` helper — the single entry point for all sends
- React Email templates for each flow
- Real API behaviour: base URL, auth, request shape, response shape
- All error codes you will encounter during development
- Rate limit headers and how to handle 429 responses
- Local development and testing approach

Read this skill in full before writing any email-related code.

---

## API Fundamentals

### Base URL

```
https://api.resend.com
```

All requests must use HTTPS. HTTP is not supported.

### Authentication

Every request must include an `Authorization` header:

```
Authorization: Bearer re_xxxxxxxxx
```

Replace `re_xxxxxxxxx` with the value from `process.env.RESEND_API_KEY`.

### User-Agent Requirement

All API requests must include a `User-Agent` header. The Resend Node.js SDK
sets this automatically. If you ever call the REST endpoint directly (not via
the SDK), add it manually — requests without it are rejected with `403 / error 1010`.

### Send Email Endpoint

```
POST https://api.resend.com/emails
```

**Required body fields:**

| Field     | Type                 | Description                                             |
|-----------|----------------------|---------------------------------------------------------|
| `from`    | `string`             | Sender address. Format: `"Name <email@domain.com>"`     |
| `to`      | `string \| string[]` | Recipient(s). Maximum 50 per request.                   |
| `subject` | `string`             | Email subject line.                                     |

**One of these must also be included:**

| Field   | Type              | Description                                                 |
|---------|-------------------|-------------------------------------------------------------|
| `react` | `React.ReactNode` | React Email component. Available in Node.js SDK only. Use this. |
| `html`  | `string`          | Raw HTML fallback if not using React Email.                 |
| `text`  | `string`          | Plain text. Auto-generated from HTML if omitted.            |

**Successful response (`200`):**

```json
{ "id": "49a3999c-0ce1-4ea6-ab68-afcd6dc2e794" }
```

Store this `id` if you want to track delivery status later via the retrieve endpoint.

**Idempotency (optional but recommended for retries):**  
Pass an `Idempotency-Key` header (1–256 characters, unique per request, expires
after 24 hours) to prevent duplicate sends if a request is retried after a
network failure.

---

## Rate Limits

The default limit is **5 requests per second per team**, shared across all API
keys. Every response includes these headers:

| Header                | Description                                          |
|-----------------------|------------------------------------------------------|
| `ratelimit-limit`     | Maximum requests allowed in the current window       |
| `ratelimit-remaining` | Requests remaining in the current window             |
| `ratelimit-reset`     | Seconds until the window resets                      |
| `retry-after`         | Seconds to wait before retrying after a 429          |

SecureGate sends at most 3 transactional emails per user session (verify,
reset request, reset confirm), so the default limit is more than sufficient.
No queue mechanism is needed unless you add bulk sending later.

When a `429` is received, log `retry-after` internally and surface only a
generic error to the user — never expose rate limit details.

---

## Email Quotas

Two additional response headers track your sending budget:

| Header                   | Available On | Description                    |
|--------------------------|--------------|--------------------------------|
| `x-resend-daily-quota`   | Free plan    | Daily email count used         |
| `x-resend-monthly-quota` | All plans    | Monthly email count used       |

If either quota is exceeded, Resend returns `429` with `daily_quota_exceeded`
or `monthly_quota_exceeded`. Handle both identically to rate limit errors.
Both sent and received emails count toward the quota.

---

## Installation

```bash
npm install resend @react-email/components
```

---

## Environment Variables

```env
RESEND_API_KEY=re_xxxxxxxxx
EMAIL_FROM=SecureGate <noreply@yourdomain.com>
```

> **Domain verification required:** You can only send to your own registered
> email address while using `onboarding@resend.dev` as the sender. To send to
> real users you must verify a domain at resend.com/domains and use an address
> from that domain in `EMAIL_FROM`.

---

## Core Helper: `lib/email.ts`

This is the **only** file in the codebase that imports from `resend`.
All routes and server actions send email through this helper — never
instantiate `Resend` anywhere else.

```ts
import { Resend } from "resend";
import type { ReactElement } from "react";

const resend = new Resend(process.env.RESEND_API_KEY);

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
  if (!process.env.RESEND_API_KEY) {
    console.error("[EMAIL] RESEND_API_KEY is not set");
    return { success: false, error: "Email service is not configured" };
  }

  if (!process.env.EMAIL_FROM) {
    console.error("[EMAIL] EMAIL_FROM is not set");
    return { success: false, error: "Email service is not configured" };
  }

  try {
    const sendOptions = {
      from: process.env.EMAIL_FROM,
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
```

---

## React Email Templates

All templates live in `securegate-temp/emails/`.
Each accepts typed props and returns a React Email component tree.
Always use the `react` field in `sendEmail` — not raw `html`.

> **Inline styles in email templates:** Email clients do not support CSS Modules,
> external stylesheets, or CSS custom properties (`var(--*)`). All styling must
> be inlined. This is the one exception to the project's "no inline styles" rule.
> Design token values (colors, radii, spacing) must be duplicated as raw values
> in email templates — add a comment referencing the source token so the value
> can be updated when the token changes.

### Email Verification Template (`emails/VerificationEmail.tsx`)

**Used in:** Sign Up flow — sent immediately after account creation.  
**Token expiry:** 24 hours (enforced in `lib/tokens.ts`).

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
      <Preview>Verify your SecureGate account</Preview>
      {/*
    NOTE: All values below are inlined because email clients do not support
    CSS variables. These correspond to design tokens in tokens/design-tokens.css.
    If you update a token value here, update the CSS file too — and vice versa.
  */}
  <Body style={{ backgroundColor: "#ffffff", fontFamily: "sans-serif" }}>
        <Container style={{ maxWidth: "480px", margin: "0 auto", padding: "32px" }}>
          <Heading style={{ fontSize: "20px", color: "#111111", margin: "0 0 16px" }}>
            Verify your email address
          </Heading>
          <Text style={{ color: "#555555", margin: "0 0 24px", lineHeight: "1.6" }}>
            Hi {name}, you&apos;re almost in. Click below to verify your account.
            This link expires in <strong>24 hours</strong>.
          </Text>
          <Section>
            <Button
              href={verificationUrl}
              style={{
                backgroundColor: "#1a1a2e",   /* --color-primary approximant */
                color: "#ffffff",              /* --color-on-primary */
                padding: "12px 24px",          /* spacing scale: 12px, 24px */
                borderRadius: "4px",           /* --radius-sm */
                textDecoration: "none",
                fontSize: "14px",              /* --typo-label-large-font-size */
                fontWeight: "500",
            >
              Verify email address
            </Button>
          </Section>
          <Text style={{ color: "#999999", fontSize: "12px", marginTop: "32px" }}>
            If you did not create a SecureGate account, you can safely ignore
            this email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
```

### Welcome Email Template (`emails/WelcomeEmail.tsx`)

**Used in:** Post-verification — sent after the user confirms their email address.  
**Purpose:** Confirm successful verification, provide next steps.

Follow the same inline-style pattern shown below for verification and reset templates.

---

### Password Reset Template (`emails/PasswordResetEmail.tsx`)

**Used in:** Forgot Password flow — sent when a reset is requested.  
**Token expiry:** 1 hour (enforced in `lib/tokens.ts`).

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
          <Heading style={{ fontSize: "20px", color: "#111111", margin: "0 0 16px" }}>
            Reset your password
          </Heading>
          <Text style={{ color: "#555555", margin: "0 0 24px", lineHeight: "1.6" }}>
            Hi {name}, we received a request to reset your password. Click
            below to choose a new one. This link expires in{" "}
            <strong>1 hour</strong> and can only be used once.
          </Text>
          <Section>
            <Button
              href={resetUrl}
              style={{
                backgroundColor: "#1a1a2e",
                color: "#ffffff",
                padding: "12px 24px",
                borderRadius: "4px",
                textDecoration: "none",
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              Reset password
            </Button>
          </Section>
          <Text style={{ color: "#555555", fontSize: "13px", marginTop: "24px" }}>
            If this link has expired, visit the{" "}
            <a href="/forgot-password" style={{ color: "#1a1a2e" }}>
              forgot password page
            </a>{" "}
            to request a new one.
          </Text>
          <Text style={{ color: "#999999", fontSize: "12px", marginTop: "16px" }}>
            If you did not request this, your password will not change.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
```

---

## Usage in Routes

### Sign Up Route — Send Verification Email

```ts
// app/api/register/route.ts (after user is created and token is generated)
import { sendEmail } from "@/lib/email";
import { VerificationEmail } from "@/emails/VerificationEmail";

const verificationUrl =
  `${process.env.NEXTAUTH_URL}/verify-email?token=${plainToken}`;

const emailResult = await sendEmail({
  to: user.email,
  subject: "Verify your SecureGate account",
  template: <VerificationEmail name={user.name} verificationUrl={verificationUrl} />,
  idempotencyKey: `verify:${user.id}`,
});

if (!emailResult.success) {
  // Do NOT block registration if the email fails.
  // The account is created. The user can request a new link from the UI.
  console.warn("[REGISTER] Verification email failed for user:", user.id);
}
```

### Forgot Password Route — Send Reset Email

```ts
// app/api/forgot-password/route.ts (after token is generated and stored)
import { sendEmail } from "@/lib/email";
import { PasswordResetEmail } from "@/emails/PasswordResetEmail";

const resetUrl =
  `${process.env.NEXTAUTH_URL}/forgot-password/reset?token=${plainToken}`;

const emailResult = await sendEmail({
  to: user.email,
  subject: "Reset your SecureGate password",
  template: <PasswordResetEmail name={user.name} resetUrl={resetUrl} />,
  idempotencyKey: `reset:${user.id}:${tokenExpiresAt.getTime()}`,
});

if (!emailResult.success) {
  console.warn("[FORGOT_PASSWORD] Reset email failed for user:", user.id);
}

// ALWAYS return the same response — never confirm whether the email exists.
return NextResponse.json({
  message:
    "If an account exists for this email, a reset link has been sent.",
});
```

---

## Error Reference

All errors from the Resend API that are relevant to SecureGate:

| Status | Error Type                   | Cause                                          | Action                                                   |
|--------|------------------------------|------------------------------------------------|----------------------------------------------------------|
| `400`  | `validation_error`           | Malformed request field                        | Check `from`, `to`, `subject` are present and valid      |
| `400`  | `invalid_idempotency_key`    | Key outside 1–256 chars                        | Fix the key length or remove it                          |
| `401`  | `missing_api_key`            | No `Authorization` header                      | Ensure `RESEND_API_KEY` is set and exported              |
| `401`  | `restricted_api_key`         | Key only has sending access                    | Use a Full Access key for non-send operations            |
| `403`  | `invalid_api_key`            | Key is wrong or revoked                        | Regenerate at resend.com/api-keys                        |
| `403`  | `validation_error`           | Sending to non-own address via `resend.dev`    | Verify your domain at resend.com/domains                 |
| `403`  | `validation_error`           | `from` domain not verified                     | Add + verify domain in Resend dashboard                  |
| `409`  | `invalid_idempotent_request` | Same key used with a different payload         | Use a unique key per distinct send                       |
| `422`  | `invalid_from_address`       | `from` format is invalid                       | Use `email@domain.com` or `Name <email@domain.com>`      |
| `422`  | `missing_required_field`     | `from`, `to`, or `subject` is absent           | Ensure all required fields are present                   |
| `429`  | `rate_limit_exceeded`        | More than 5 requests/second                    | Reduce frequency; read `retry-after` header              |
| `429`  | `daily_quota_exceeded`       | Daily free-tier limit reached                  | Upgrade plan or wait 24 hours                            |
| `429`  | `monthly_quota_exceeded`     | Monthly quota reached                          | Upgrade plan at resend.com/settings/billing              |
| `500`  | `application_error`          | Unexpected Resend server error                 | Retry after delay; check resend-status.com               |

**Rule:** Log the full error object internally with a `[EMAIL_ERROR]` prefix.
Never return Resend error types, codes, or messages to end users. Always return
the generic string `"Failed to send email"`.

---

## Local Development

### Option 1 — React Email Dev Server *(recommended for template work)*

Preview all templates in `emails/` without sending any real emails:

```bash
npx react-email dev
```

Opens at `http://localhost:3000` with live reload on template changes.

### Option 2 — Send to your own address

While `EMAIL_FROM` uses `onboarding@resend.dev`, Resend only delivers to the
email address registered to your Resend account. Use this to test the full
send path during early development.

### Option 3 — Verified domain *(production-equivalent)*

Add and verify your own domain at resend.com/domains, update `EMAIL_FROM` to
`yourname@yourdomain.com`, and you can send to any address.

---

## Pre-Deployment Checklist

- [ ] `RESEND_API_KEY` is set in Vercel environment variables (not just `.env.local`)
- [ ] `EMAIL_FROM` uses a verified domain — not `onboarding@resend.dev`
- [ ] All email templates render correctly in the React Email dev server
- [ ] Verification URL uses `NEXTAUTH_URL`, not `localhost`
- [ ] Reset URL uses `NEXTAUTH_URL`, not `localhost`
- [ ] Failed email sends do not block account creation or forgot-password responses
- [ ] No Resend error types or messages are returned to the client
- [ ] Idempotency keys are set on all sends that could be retried
