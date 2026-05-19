# Architecture Rules

## Purpose

These rules govern how SecureGate is structured — where files live, how routes
are named, and how concerns are separated. Every agent and contributor must follow
this structure without deviation.

---

## Folder Structure

```
securegate/
├── app/
│   ├── (auth)/                     ← Route group for unauthenticated pages
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── signup/
│   │   │   └── page.tsx
│   │   ├── verify-email/
│   │   │   └── page.tsx
│   │   └── forgot-password/
│   │       ├── page.tsx
│   │       └── reset/
│   │           └── page.tsx
│   ├── (protected)/                ← Route group for authenticated pages
│   │   └── dashboard/
│   │       └── page.tsx
│   ├── api/
│   │   ├── auth/
│   │   │   └── [...nextauth]/
│   │   │       └── route.ts        ← NextAuth handler
│   │   ├── register/
│   │   │   └── route.ts
│   │   ├── verify-email/
│   │   │   └── route.ts
│   │   ├── forgot-password/
│   │   │   └── route.ts
│   │   └── reset-password/
│   │       └── route.ts
│   ├── layout.tsx                  ← Root layout
│   └── globals.css
├── components/
│   ├── ui/                         ← Primitive UI components (Button, Input, etc.)
│   ├── forms/                      ← Form-level components (LoginForm, SignUpForm, etc.)
│   └── shared/                     ← Shared layout pieces (Logo, PageWrapper, etc.)
├── emails/                         ← React Email templates
│   ├── VerificationEmail.tsx
│   ├── PasswordResetEmail.tsx
│   └── WelcomeEmail.tsx
├── lib/
│   ├── auth.ts                     ← NextAuth config
│   ├── db.ts                       ← Prisma client singleton
│   ├── email.ts                    ← Resend send helper
│   ├── tokens.ts                   ← Token generation & validation
│   ├── rate-limit.ts               ← Upstash rate limiter instance
│   └── validations/
│       ├── auth.ts                 ← Zod schemas for auth forms
│       └── password.ts             ← Password strength rules
├── middleware.ts                   ← Route protection & rate limiting
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── .agents/
│   └── rules/
└── skills/
```

---

## Routing Rules

- Use **route groups** `(auth)` and `(protected)` to separate public and guarded pages
- All API routes live under `app/api/`
- The NextAuth handler is always at `app/api/auth/[...nextauth]/route.ts`
- Never put business logic directly in `page.tsx` — delegate to server actions or API routes

---

## Middleware

`middleware.ts` at the project root handles:

1. **Authentication guard** — redirect unauthenticated users from protected routes to `/login`
2. **Verification guard** — redirect unverified users from the dashboard to `/verify-email`
3. **Rate limiting** — enforce request limits on `POST /api/register` and `POST /api/auth/signin`

The matcher must explicitly list protected routes. Never use a wildcard that could
accidentally guard public assets.

```ts
export const config = {
  matcher: ["/dashboard/:path*", "/api/register", "/api/auth/signin"],
};
```

---

## Library Layer (`lib/`)

| File              | Responsibility                                              |
|-------------------|-------------------------------------------------------------|
| `auth.ts`         | NextAuth configuration — providers, callbacks, adapter      |
| `db.ts`           | Single Prisma client instance (singleton pattern)           |
| `email.ts`        | Wraps Resend — exposes typed `sendEmail()` function         |
| `tokens.ts`       | `generateToken()`, `validateToken()`, `deleteToken()`       |
| `rate-limit.ts`   | Upstash Ratelimit instance with sliding window config       |

No file outside `lib/` should import from `@prisma/client` directly — always go
through `lib/db.ts`.

---

## Naming Conventions

| Thing              | Convention         | Example                        |
|--------------------|--------------------|--------------------------------|
| Components         | PascalCase         | `LoginForm.tsx`                |
| Hooks              | camelCase + "use"  | `usePasswordStrength.ts`       |
| Utility functions  | camelCase          | `generateToken.ts`             |
| API routes         | kebab-case folders | `forgot-password/route.ts`     |
| Zod schemas        | PascalCase + Schema| `LoginSchema`, `SignUpSchema`  |
| Prisma models      | PascalCase         | `User`, `Session`              |
| Env variables      | SCREAMING_SNAKE    | `RESEND_API_KEY`               |

---

## Import Rules

- Use absolute imports via `@/` alias (configured in `tsconfig.json`)
- Never use relative `../../../` paths more than one level deep
- Group imports: external packages → internal `@/lib` → internal `@/components`

```ts
// ✅ Correct
import { db } from "@/lib/db";
import { LoginForm } from "@/components/forms/LoginForm";

// ❌ Wrong
import { db } from "../../../lib/db";
```

---

## What Agents Must Never Do

- Create files outside the defined structure without documenting why
- Add new top-level folders without updating `AGENTS.md`
- Import Prisma directly in components or page files
- Put sensitive logic in client components (`"use client"`)
