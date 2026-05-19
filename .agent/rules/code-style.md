# Code Style Rules

## Purpose

These rules define how all TypeScript and React code must be written in SecureGate.
Consistency here makes the codebase readable, reviewable, and safe.

---

## TypeScript

### Strict Mode

TypeScript strict mode is always enabled. Never disable it.

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true
  }
}
```

### Types vs Interfaces

- Use `interface` for object shapes that describe data structures or props
- Use `type` for unions, intersections, and utility types
- Never use `any` — use `unknown` and narrow it, or define a proper type

```ts
// ✅ Correct
interface UserProps {
  name: string;
  email: string;
  verified: boolean;
}

type AuthResult = { success: true; token: string } | { success: false; error: string };

// ❌ Wrong
const handler = async (req: any) => { ... };
```

### Explicit Return Types

All functions must have an explicit return type unless the return is trivially
inferred (e.g. a one-line arrow that returns a primitive).

```ts
// ✅ Correct
async function generateToken(userId: string): Promise<string> { ... }

// ❌ Wrong
async function generateToken(userId: string) { ... }
```

### Null Handling

- Never use `!` non-null assertion unless absolutely unavoidable, and always add a comment
- Prefer early returns to guard against null/undefined

```ts
// ✅ Correct
const user = await db.user.findUnique({ where: { email } });
if (!user) return { error: "User not found" };

// ❌ Wrong
const user = await db.user.findUnique({ where: { email } })!;
```

---

## Async / Await

- Always use `async/await` — never `.then()` chains
- Always wrap async operations in try/catch at the API boundary
- Never let unhandled promise rejections propagate to the client

```ts
// ✅ Correct
try {
  const result = await sendVerificationEmail(user.email);
} catch (error) {
  console.error("[EMAIL_ERROR]", error);
  return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
}
```

---

## Zod Validation

- All user inputs must be validated with a Zod schema before any processing
- Define schemas in `lib/validations/` — never inline them in route handlers
- Use `.safeParse()` so errors are caught without throwing

```ts
// ✅ Correct
const result = LoginSchema.safeParse(body);
if (!result.success) {
  return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
}

// ❌ Wrong
const result = LoginSchema.parse(body); // throws on failure
```

---

## React Components

### Server vs Client

- Default to **Server Components** — only add `"use client"` when the component
  uses browser APIs, state, or event handlers
- Never put sensitive logic (DB calls, token generation) in client components
- Keep client components as small as possible — pass data down via props

### Component Structure

```tsx
// 1. Imports (external → internal lib → internal components)
// 2. Types / interfaces
// 3. Component function
// 4. Export

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { ButtonProps } from "./Button.types";

interface LoginFormProps {
  onSuccess: () => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  // ...
}
```

### Props

- Always destructure props in the function signature
- Always type props with an interface
- Never use `React.FC` — just type the props directly

---

## Error Messages

- Error messages shown to users must be generic enough not to reveal system details
- Internal errors are logged with a `[CONTEXT]` prefix, never surfaced to the client

```ts
// User-facing
return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

// Internal log
console.error("[LOGIN_ERROR]", error);
```

---

## Comments

- Write comments for *why*, not *what*
- All exported functions must have a JSDoc comment

```ts
/**
 * Generates a cryptographically secure random token for email verification.
 * Token is stored hashed in the database; the plain token is sent to the user.
 */
export async function generateVerificationToken(userId: string): Promise<string> { ... }
```

---

## Formatting

- Indentation: **2 spaces** (no tabs)
- Quotes: **double quotes** for JSX props, **single quotes** for TypeScript strings
- Trailing commas: **always** in multi-line structures
- Max line length: **100 characters**
- Use Prettier with the project config — never override formatting manually

---

## What Agents Must Never Do

- Use `any` type without an inline comment and explicit justification
- Skip Zod validation on any user-supplied input
- Write `.then()` chains instead of `async/await`
- Put database or auth logic inside a client component
- Surface raw error messages or stack traces to the end user
