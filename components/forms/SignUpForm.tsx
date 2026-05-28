"use client";

import * as React from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { PasswordStrengthIndicator } from "@/components/ui/PasswordStrengthIndicator";
import { SignUpSchema } from "@/lib/validations/auth";

import styles from "./SignUpForm.module.css";

export function SignUpForm() {
  const [name, setName] = React.useState("");
  const [nameTouched, setNameTouched] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [emailTouched, setEmailTouched] = React.useState(false);
  const [password, setPassword] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [errors, setErrors] = React.useState<{ name?: string; email?: string; password?: string; form?: string }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});
    setSuccess(false);

    // Validate inputs locally using Zod
    const validationResult = SignUpSchema.safeParse({ name, email, password });
    if (!validationResult.success) {
      const fieldErrors: typeof errors = {};
      validationResult.error.issues.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as "name" | "email" | "password"] = err.message;
        }
      });
      setErrors(fieldErrors);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors({ form: data.message || "Registration failed. Please try again." });
        setIsLoading(false);
      } else {
        setSuccess(true);
        setIsLoading(false);
        setName("");
        setEmail("");
        setPassword("");
      }
    } catch {
      setErrors({ form: "An unexpected error occurred. Please try again." });
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className={styles.successContainer}>
        <div className={styles.successIcon} aria-hidden="true">✉️</div>
        <h2 className={styles.successTitle}>Confirm your email</h2>
        <p className={styles.successText}>
          We sent a verification link to your email address. Please click the link to activate your account.
        </p>
        <p className={styles.successHint}>
          Didn&apos;t receive it? Check your spam folder or try logging in to trigger a new link.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <a href="/" className={styles.logoLink} aria-label="Go to home page">
          <span className={styles.logo} aria-hidden="true">🔐</span>
        </a>
        <h1 className={styles.title}>Create your account</h1>
        <p className={styles.subtitle}>Get started with SecureGate auth</p>
      </div>

      <form onSubmit={handleSubmit} className={styles.form} noValidate>
      {errors.form && (
        <div className={styles.alert} role="alert">
          {errors.form}
        </div>
      )}

      <Input
        label="Enter Full Name"
        type="text"
        placeholder="Jane Doe"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={() => setNameTouched(true)}
        className={nameTouched ? styles.nameDone : undefined}
        error={errors.name}
        disabled={isLoading}
        autoComplete="name"
        required
      />

      <Input
        label="Enter Email"
        type="email"
        placeholder="jane@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onBlur={() => setEmailTouched(true)}
        className={emailTouched ? styles.nameDone : undefined}
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
        error={errors.password}
        disabled={isLoading}
        autoComplete="new-password"
        required
      />

      <PasswordStrengthIndicator password={password} />

      <Button type="submit" className={styles.button} isLoading={isLoading}>
        Create Account
      </Button>
    </form>
    </div>
  );
}

export default SignUpForm;
