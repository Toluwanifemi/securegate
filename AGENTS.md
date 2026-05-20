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
- Follow the rules defined in `.agent/rules/` for every file you create or modify
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
| Email        | Nodemailer + SMTP                  |
| Validation   | Zod                             |
| Rate Limit   | Upstash/ratelimit               |
| Deployment   | Vercel                          |
| Repo         | GitHub                          |

---

## Core Features

1. **Sign Up** — Zod-validated form, password strength indicator, email confirmation via Nodemailer
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
id, name, email, passwordHash, createdAt, emailVerified
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
├── .agent/
│   ├── rules/
│   │   ├── architecture.md           ← Folder structure & routing rules
│   │   ├── code-style.md             ← TypeScript & formatting standards
│   │   ├── design-system.md          ← UI component & styling rules
│   │   └── security.md               ← Security implementation standards
│   └── skills/
│       ├── nodemailer-integration/       ← Email sending via Nodemailer + SMTP
│       ├── component-builder/        ← UI component scaffolding
│       ├── api-route-scaffolder/     ← API route scaffolding
│       └── db-migration-runner/      ← Prisma migration workflow
├── app/                          ← App Router pages & API routes
├── components/                   ← React components (ui/, forms/, shared/)
├── lib/                          ← Shared utilities (db, auth, tokens, etc.)
├── emails/                       ← React Email templates
├── prisma/                       ← Prisma schema & migrations
├── middleware.ts                 ← Route protection & rate limiting
├── auth.config.ts                ← NextAuth base config
├── public/                       ← Static assets
├── package.json
├── tsconfig.json
└── next.config.mjs
└── tokens/                           ← Design tokens (CSS custom properties)
```

---

## Rules Reference

Before writing any code, the agent MUST read the relevant rule files:

| Task                          | Rule File                         |
|-------------------------------|-----------------------------------|
| Creating files or folders     | `.agent/rules/architecture.md`   |
| Writing any TypeScript        | `.agent/rules/code-style.md`     |
| Building UI components        | `.agent/rules/design-system.md`  |
| Handling auth, tokens, input  | `.agent/rules/security.md`       |

---

## Skills Reference

| Task                         | Skill                                        |
|------------------------------|----------------------------------------------|
| Sending email via Nodemailer     | `.agent/skills/nodemailer-integration/SKILL.md`         |
| Building a new UI component  | `.agent/skills/component-builder/SKILL.md`          |
| Scaffolding an API route     | `.agent/skills/api-route-scaffolder/SKILL.md`       |
| Running a DB migration       | `.agent/skills/db-migration-runner/SKILL.md`        |

---

## Environment Variables Required

```env
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=

SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=

UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

---

## Scripts

All commands run from the project root:

| Command           | Description                  |
|-------------------|------------------------------|
| `npm run dev`     | Start development server     |
| `npm run build`   | Production build             |
| `npm run start`   | Start production server      |
| `npm run lint`    | Run ESLint                   |

---

## Behaviour Rules

- If a requirement is unclear, ask **one or two specific questions** before proceeding
- Never invent data, values, or flows the PRD did not specify
- If a task cannot be completed, output a plain-English error describing what is blocking it
- All code must work with minimal configuration after environment variables are set
