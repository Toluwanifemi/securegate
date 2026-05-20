"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ForgotPasswordSchema } from "@/lib/validations/auth";
import styles from "./ForgotPasswordForm.module.css";

export function ForgotPasswordForm() {
  const [email, setEmail] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [errors, setErrors] = React.useState<{ email?: string; form?: string }>({});
  const [successMessage, setSuccessMessage] = React.useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});
    setSuccessMessage("");

    const validationResult = ForgotPasswordSchema.safeParse({ email });
    if (!validationResult.success) {
      setErrors({ email: validationResult.error.issues[0]?.message });
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage(data.message || "If an account exists, a reset link has been sent.");
        setEmail("");
      } else {
        setErrors({ form: data.message || "Failed to submit request. Please try again." });
      }
    } catch {
      setErrors({ form: "An unexpected error occurred. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  if (successMessage) {
    return (
      <div className={styles.successView}>
        <div className={styles.successAlert} role="status">
          {successMessage}
        </div>
        <p className={styles.successText}>
          Please check your inbox and follow the instructions to reset your password.
        </p>
        <Button className={styles.button} onClick={() => setSuccessMessage("")}>
          Request Another Link
        </Button>
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
        label="Email Address"
        type="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={errors.email}
        disabled={isLoading}
        autoComplete="email"
        required
      />

      <Button type="submit" className={styles.button} isLoading={isLoading}>
        Send Reset Link
      </Button>
    </form>
  );
}

export default ForgotPasswordForm;
