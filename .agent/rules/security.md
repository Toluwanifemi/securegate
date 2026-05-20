# Security Rules

## Purpose

SecureGate is a security product. Every line of code that touches authentication,
tokens, sessions, passwords, or user input must be written to the standards in
this file. These rules are non-negotiable and align with OWASP and NIST guidelines.

---

## Input Validation

### Rule: Validate all user input with Zod before any processing

Never trust data from the request body, query string, or headers.

```ts
// ✅ Correct — validate first, process after
const result = LoginSchema.safeParse(await req.json());
if (!result.success) {
  return NextResponse.json({ error: "Invalid input" }, { status: 400 });
}
const { email, password } = result.data;

// ❌ Wrong — destructured before validation
const { email, password } = await req.json();
```

### Rule: Normalise email addresses before storing or comparing

```ts
const normalisedEmail = email.toLowerCase().trim();
```

---

## Password Handling

### Rule: Hash passwords with bcryptjs — never store plaintext

```ts
import bcrypt from "bcryptjs";

// Always use an explicit salt round value — never leave it at the default
const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

### Rule: Enforce password minimum requirements via Zod

Align with NIST SP 800-63B: focus on length, not composition rules.

```ts
const PasswordSchema = z
  .string()
  .min(8, "Must be at least 8 characters")
  .max(128, "Password must be 128 characters or fewer");
```

Do not enforce uppercase, number, or special-character requirements — they
encourage predictable patterns (e.g. `Password1!`) without meaningful security gains.
If you need stronger auth, add multi-factor authentication instead.

### Rule: Never log passwords — not even in development

---

## Error Messages

### Rule: Never reveal whether an email exists in the system

Use the same generic message for all login failure cases.

```ts
// ✅ Correct — same message regardless of cause
return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

// ❌ Wrong — reveals account existence
return NextResponse.json({ error: "No account found for this email" }, { status: 401 });
```

### Rule: Never surface stack traces or internal error details to the client

```ts
try {
  // ...
} catch (error) {
  console.error("[AUTH_ERROR]", error);                          // internal log
  return NextResponse.json({ error: "Something went wrong" }, { status: 500 }); // generic client response
}
```

---

## Tokens

### Rule: Generate tokens with `crypto.randomBytes` — never `Math.random()`

```ts
import crypto from "crypto";

export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString("hex");
}
```

### Rule: All tokens must have an expiry time

| Token type              | Expiry        |
|-------------------------|---------------|
| Email verification      | 24 hours      |
| Password reset          | 1 hour        |
| Session (NextAuth)      | 30 days       |

### Rule: Invalidate tokens immediately after use

Once a token is consumed (verified or used to reset), delete it from the database
in the same transaction as the action it authorises.

```ts
await db.$transaction([
  db.user.update({ where: { id }, data: { emailVerified: new Date() } }),
  db.emailVerificationToken.delete({ where: { token: hashedToken } }),
]);
```

### Rule: Store only the hash of a token in the database

The plain token is sent to the user by email. The database holds only `sha256(token)`.

```ts
import crypto from "crypto";

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}
```

---

## CSRF Protection

### Rule: Protect all custom API routes against CSRF

NextAuth.js handles CSRF for `POST /api/auth/signin` and related endpoints automatically.
For custom auth routes (`register`, `forgot-password`, `reset-password`), use
origin/referer header validation implemented in `lib/csrf.ts`:

```ts
// lib/csrf.ts
export function validateCsrf(req: Request): boolean {
  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");
  const host = req.headers.get("host");
  if (!host) return false;
  if (origin) {
    try { return new URL(origin).host === host; } catch { return false; }
  }
  if (referer) {
    try { return new URL(referer).host === host; } catch { return false; }
  }
  return false;
}
```

Usage in every API route:

```ts
import { validateCsrf } from "@/lib/csrf";

if (!validateCsrf(req)) {
  return NextResponse.json({ message: "Invalid request origin" }, { status: 403 });
}
```

---

## Sessions

### Rule: Use HttpOnly, Secure, SameSite=Lax cookies for sessions

NextAuth.js handles this automatically when configured correctly. Do not override
the cookie settings to make debugging easier — use a dev-only override instead.

### Rule: Destroy the session completely on logout

```ts
// In a logout server action or route
await signOut({ redirect: false });
// NextAuth clears the session cookie automatically
```

---

## Rate Limiting

### Rule: Require HTTPS for all authentication pages

All pages in the `(auth)` route group and all `api/auth/*` endpoints must only
be served over HTTPS. In production, Vercel enforces this automatically. For
local development, NextAuth warns when used over HTTP.

---

### Rule: Apply rate limiting to all authentication endpoints

| Endpoint                  | Limit             | Window     | Scope     |
|---------------------------|-------------------|------------|-----------|
| `POST /api/auth/signin`   | 5 attempts        | 15 minutes | Per-IP    |
| `POST /api/register`      | 3 attempts        | 1 hour     | Per-IP    |
| `POST /api/forgot-password` | 3 attempts      | 1 hour     | Per-IP    |

```ts
// lib/rate-limit.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export const loginRateLimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, "15 m"),
  analytics: false,
});
```

When the limit is hit, return `429 Too Many Requests` with a user-friendly message
and a `Retry-After` header (seconds until reset). Never reveal the remaining limit
count to the client.

---

## Environment Variables

### Rule: Never hardcode secrets in source code

All secrets live in `.env.local` (local) and Vercel environment variables (production).

```ts
// ✅ Correct
const apiKey = process.env.RESEND_API_KEY;
if (!apiKey) throw new Error("RESEND_API_KEY is not set");

// ❌ Wrong
const apiKey = "re_abc123...";
```

### Required secrets

```
DATABASE_URL             ← PostgreSQL connection string
NEXTAUTH_SECRET          ← 32+ char random string
NEXTAUTH_URL             ← Full URL of the deployment
RESEND_API_KEY           ← Resend API key
EMAIL_FROM               ← Verified sender address
UPSTASH_REDIS_REST_URL   ← Upstash Redis endpoint
UPSTASH_REDIS_REST_TOKEN ← Upstash Redis auth token
```

---

## Database

### Rule: Never use raw SQL unless Prisma cannot express the query

### Rule: Always validate that a record belongs to the authenticated user before updating it

```ts
const token = await db.passwordResetToken.findUnique({ where: { token: hashedToken } });

if (!token || token.expires < new Date()) {
  return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
}
```

---

## What Agents Must Never Do

- Store a plaintext password at any point in any variable, log, or database field
- Generate tokens with `Math.random()` or `Date.now()`
- Return different error messages based on whether an email exists
- Skip rate limiting on any auth endpoint
- Surface raw database errors or stack traces to the client
- Store full tokens in the database — always store the hash
- Hardcode any secret, API key, or connection string
