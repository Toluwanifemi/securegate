# API Route Scaffolder Skill

## Purpose

Create new API routes in the SecureGate application following the established
patterns for validation, rate limiting, CSRF protection, error handling, and
response formatting.

## Before You Start

- Read `.agent/rules/security.md` — all routes must follow the security standards
- Check if the route already exists in `app/api/`
- Decide if the route needs authentication (session check) or is public

## Route Location

All API routes live under `app/api/<name>/route.ts`. Use kebab-case for folder
names (e.g. `forgot-password`, `verify-email`, `reset-password`).

## Route Template

Every API route follows the same structure. Use this template for new routes:

```ts
import { NextResponse } from "next/server";
import { ratelimit } from "@/lib/rate-limit";
import { validateCsrf } from "@/lib/csrf";

export async function POST(req: Request) {
  // CSRF protection
  if (!validateCsrf(req)) {
    return NextResponse.json({ message: "Invalid request origin" }, { status: 403 });
  }

  // Rate limiting (per-IP)
  const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
  const limitRes = await ratelimit.limit(`endpoint-name:${ip}`);
  if (!limitRes.success) {
    return NextResponse.json(
      { message: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    // Validate with Zod schema
    // Process request
    // Return response
  } catch (error) {
    console.error("[CONTEXT_ERROR]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
```

## Route Pattern Checklist

- [ ] CSRF validation via `validateCsrf(req)`
- [ ] Rate limiting via `ratelimit.limit(\`name:${ip}\`)`
- [ ] Zod validation before processing (use `.safeParse()`, never `.parse()`)
- [ ] Generic error messages — never reveal system details
- [ ] `console.error` with `[CONTEXT]` prefix for internal errors
- [ ] Generic `"Internal server error"` response to client
- [ ] Non-revealing responses for auth-sensitive endpoints (same message regardless of existence)

## Authentication

- Routes that require a logged-in user should use the `auth()` helper:

```ts
import { auth } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  // ...
}
```

- Routes that operate on user data must verify ownership (the record belongs to
  `session.user.id`)

## Common Mistakes

- Using `.parse()` instead of `.safeParse()` on Zod schemas — `.parse()` throws
- Returning different error messages based on whether a user/email exists (email enumeration)
- Forgetting CSRF validation on POST/PUT/DELETE endpoints
- Missing rate limiting on endpoints that accept user input
- Putting business logic in the route handler instead of delegating to `lib/`
