"use client";

import * as React from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { LoginSchema } from "@/lib/validations/auth";
import styles from "./LoginForm.module.css";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawCallbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const callbackUrl = rawCallbackUrl.startsWith("/") && !rawCallbackUrl.startsWith("//")
    ? rawCallbackUrl
    : "/dashboard";

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [errors, setErrors] = React.useState<{ email?: string; password?: string; form?: string }>({});

  // Display verification notification if redirected after registering or if requested by verification query param
  const isVerifiedQuery = searchParams.get("verified") === "true";
  const [showVerifiedMessage, setShowVerifiedMessage] = React.useState(isVerifiedQuery);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});
    setShowVerifiedMessage(false);

    // Validate inputs locally using Zod
    const validationResult = LoginSchema.safeParse({ email, password });
    if (!validationResult.success) {
      const fieldErrors: typeof errors = {};
      validationResult.error.issues.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as "email" | "password"] = err.message;
        }
      });
      setErrors(fieldErrors);
      setIsLoading(false);
      return;
    }

    try {
      // 1. Check rate limit FIRST via custom API (NextAuth swallows specific error codes)
      const rlRes = await fetch("/api/auth/rate-limit", { method: "POST" });
      if (rlRes.status === 429) {
        setErrors({ form: "Too many requests. Please try again later." });
        setIsLoading(false);
        return;
      }

      // 2. If rate limit passes, call NextAuth
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setErrors({ form: "Invalid email or password. Please try again." });
        setIsLoading(false);
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setErrors({ form: "An unexpected error occurred. Please try again." });
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form} noValidate>
      {showVerifiedMessage && (
        <div className={styles.successAlert} role="status">
          Email verified successfully! You can now log in.
        </div>
      )}

      {errors.form && (
        <div className={styles.alert} role="alert">
          {errors.form}
        </div>
      )}

      <Input
        label="Email Address"
        type="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
        }}
        onBlur={() => {
          if (!email.trim()) {
            setErrors((prev) => ({ ...prev, email: "Enter a Valid Email Address" }));
          }
        }}
        onFocus={() => setErrors((prev) => ({ ...prev, form: undefined }))}
        className={email.length > 0 ? styles.emailActive : undefined}
        error={errors.email}
        disabled={isLoading}
        autoComplete="email"
        required
      />

      <Input
        label="Password"
        type="password"
        placeholder="••••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onFocus={() => setErrors((prev) => ({ ...prev, form: undefined }))}
        error={errors.password}
        disabled={isLoading}
        autoComplete="current-password"
        required
      />

      <div className={styles.forgotContainer}>
        <a href="/auth?mode=forgot-password" className={styles.link}>
          Forgot Password?
        </a>
      </div>

      <Button type="submit" className={styles.button} isLoading={isLoading}>
        Log In
      </Button>
    </form>
  );
}

export default LoginForm;
