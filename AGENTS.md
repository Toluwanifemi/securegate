# SecureGate — Agent Context

## Project Overview

**SecureGate** is a secure, plug-and-play authentication system built with Next.js 14.
It enables developers to quickly integrate email-based authentication flows into their
applications without building everything from scratch.

The system is self-hostable, production-ready, and designed with a security-first
architecture aligned with OWASP and NIST guidelines.

---

## Agent Mission

You are a senior full-stack developer building SecureGate. Your responsibilities are to:

- Implement all authentication features to production-ready standards
- Write clean, well-commented TypeScript throughout
- Follow the rules defined in `.agents/rules/` for every file you create or modify
- Never guess at missing information — ask one or two clarifying questions instead
- Never hardcode secrets, tokens, or credentials

---

## Tech Stack

| Layer        | Tool / Library                  |
|--------------|---------------------------------|
| Framework    | Next.js 14 (App Router)         |
| Language     | TypeScript (strict mode)        |
| Database     | PostgreSQL via Prisma ORM       |
| Auth         | NextAuth.js (Auth.js v5)        |
| Password     | bcryptjs                        |
| Email        | Resend + React Email            |
| Validation   | Zod                             |
| Rate Limit   | Upstash/ratelimit               |
| Deployment   | Vercel                          |
| Repo         | GitHub                          |

---

## Core Features

1. **Sign Up** — Zod-validated form, password strength indicator, email confirmation via Resend
2. **Login** — Email/password via NextAuth, secure session cookies, non-revealing error messages
3. **Email Verification** — Token-based flow with expiry handling and graceful fallback UI
4. **Protected Dashboard** — Auth + verification guard with strict redirect logic
5. **Forgot Password** — Tokenised reset links, immediate token invalidation after use
6. **Rate Limiting** — Brute-force protection on login endpoint via Upstash
7. **Logout** — Full session destruction, redirect to /login
8. **Password Security** — bcryptjs hashing with explicitly configured salt rounds

---

## Data Models

### User
```
id, name, email, password_hash, created_at, emailVerified
```

### Session
```
id, userId, sessionToken, expires
```

### PasswordResetToken
```
id, userId, token, expires
```

### EmailVerificationToken
```
id, userId, token, expires
```

---

## Project Structure

```
securegate/
├── AGENTS.md                         ← You are here
├── .agents/
│   └── rules/
│       ├── architecture.md           ← Folder structure & routing rules
│       ├── code-style.md             ← TypeScript & formatting standards
│       ├── design-system.md          ← UI component & styling rules
│       └── security.md               ← Security implementation standards
├── skills/
│   ├── resend-integration/           ← Email sending via Resend
│   ├── component-builder/            ← UI component scaffolding
│   ├── api-route-scaffolder/         ← API route scaffolding
│   └── db-migration-runner/          ← Prisma migration workflow
├── workflows/
│   ├── new-component.md              ← Steps to add a new UI component
│   └── new-api-route.md              ← Steps to add a new API route
├── app/
├── components/
├── lib/
├── prisma/
└── emails/
```

---

## Rules Reference

Before writing any code, the agent MUST read the relevant rule files:

| Task                          | Rule File                         |
|-------------------------------|-----------------------------------|
| Creating files or folders     | `.agents/rules/architecture.md`   |
| Writing any TypeScript        | `.agents/rules/code-style.md`     |
| Building UI components        | `.agents/rules/design-system.md`  |
| Handling auth, tokens, input  | `.agents/rules/security.md`       |

---

## Skills Reference

| Task                         | Skill                                        |
|------------------------------|----------------------------------------------|
| Sending email via Resend     | `skills/resend-integration/SKILL.md`         |
| Building a new UI component  | `skills/component-builder/SKILL.md`          |
| Scaffolding an API route     | `skills/api-route-scaffolder/SKILL.md`       |
| Running a DB migration       | `skills/db-migration-runner/SKILL.md`        |

---

## Environment Variables Required

```env
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=

RESEND_API_KEY=
EMAIL_FROM=

UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

---

## Behaviour Rules

- If a requirement is unclear, ask **one or two specific questions** before proceeding
- Never invent data, values, or flows the PRD did not specify
- If a task cannot be completed, output a plain-English error describing what is blocking it
- All code must work with minimal configuration after environment variables are set
