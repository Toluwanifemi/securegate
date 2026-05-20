"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ResetPasswordSchema } from "@/lib/validations/auth";
import styles from "./ResetPasswordForm.module.css";

interface ResetPasswordFormProps {
  token: string;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const router = useRouter();

  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [errors, setErrors] = React.useState<{ password?: string; confirmPassword?: string; form?: string }>({});

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

    const validationResult = ResetPasswordSchema.safeParse({ password, confirmPassword });
    if (!validationResult.success) {
      const fieldErrors: typeof errors = {};
      validationResult.error.issues.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as "password" | "confirmPassword"] = err.message;
        }
      });
      setErrors(fieldErrors);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, confirmPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setPassword("");
        setConfirmPassword("");
        setTimeout(() => {
          router.push("/auth?mode=login");
        }, 3000);
      } else {
        setErrors({ form: data.message || "Failed to reset password. The link may have expired." });
      }
    } catch {
      setErrors({ form: "An unexpected error occurred. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className={styles.successView}>
        <div className={styles.successAlert} role="status">
          Password reset completed successfully!
        </div>
        <p className={styles.successText}>
          Redirecting you to the login page...
        </p>
        <Button className={styles.button} onClick={() => router.push("/auth?mode=login")}>
          Go to Login
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
        label="New Password"
        type="password"
        placeholder="••••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={errors.password}
        disabled={isLoading}
        autoComplete="new-password"
        required
      />

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

      <Input
        label="Confirm New Password"
        type="password"
        placeholder="••••••••"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        error={errors.confirmPassword}
        disabled={isLoading}
        autoComplete="new-password"
        required
      />

      <Button type="submit" className={styles.button} isLoading={isLoading}>
        Reset Password
      </Button>
    </form>
  );
}

export default ResetPasswordForm;
