"use client";

import * as React from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { SignUpSchema } from "@/lib/validations/auth";

import styles from "./SignUpForm.module.css";

export function SignUpForm() {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [errors, setErrors] = React.useState<{ name?: string; email?: string; password?: string; form?: string }>({});

  // Password strength indicator based on length (NIST SP 800-63B)
  const lengthProgress = Math.min(password.length / 8, 1);
  
  let strengthLabel = "Weak";
  let strengthClass = styles.strengthWeak;
  if (password.length >= 8 && password.length < 12) {
    strengthLabel = "Medium";
    strengthClass = styles.strengthMedium;
  } else if (password.length >= 12) {
    strengthLabel = "Strong";
    strengthClass = styles.strengthStrong;
  }

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
    <form onSubmit={handleSubmit} className={styles.form} noValidate>
      {errors.form && (
        <div className={styles.alert} role="alert">
          {errors.form}
        </div>
      )}

      <Input
        label="Full Name"
        type="text"
        placeholder="Jane Doe"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={errors.name}
        disabled={isLoading}
        autoComplete="name"
        required
      />

      <Input
        label="Email Address"
        type="email"
        placeholder="jane@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
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

      {/* Password Strength Indicator */}
      {password.length > 0 && (
        <div className={styles.strengthContainer}>
          <div className={styles.strengthHeader}>
            <span className={styles.strengthText}>Password Strength:</span>
            <span className={strengthClass}>{strengthLabel}</span>
          </div>
          <div className={styles.progressBarBg}>
            <div
              className={`${styles.progressBarFill} ${strengthClass}`}
              style={{ width: `${lengthProgress * 100}%` }}
            />
          </div>
          
          <ul className={styles.criteriaList} aria-label="Password requirements">
            <li className={password.length >= 8 ? styles.criteriaCheck : styles.criteriaCross}>
              At least 8 characters
            </li>
          </ul>
        </div>
      )}

      <Button type="submit" className={styles.button} isLoading={isLoading}>
        Create Account
      </Button>
    </form>
  );
}

export default SignUpForm;
