"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ResetPasswordSchema } from "@/lib/validations/auth";

import styles from "./page.module.css";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [errors, setErrors] = React.useState<{ password?: string; confirmPassword?: string; form?: string }>({});

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
    if (!token) {
      setErrors({ form: "Reset token is missing. Please request a new link." });
      return;
    }

    setIsLoading(true);
    setErrors({});
    setSuccess(false);

    // Validate inputs locally using Zod
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
        setIsLoading(false);
        setPassword("");
        setConfirmPassword("");
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      } else {
        setErrors({ form: data.message || "Failed to reset password. The link may have expired." });
        setIsLoading(false);
      }
    } catch {
      setErrors({ form: "An unexpected error occurred. Please try again." });
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.logo} aria-hidden="true">🔑</div>
          <h1 className={styles.title}>Reset Password</h1>
          <p className={styles.subtitle}>Choose a new secure password</p>
        </div>

        {!token ? (
          <div className={styles.errorView}>
            <div className={styles.alert} role="alert">
              Reset token is missing. Please request a new recovery email.
            </div>
            <Link href="/forgot-password" className={styles.buttonLink}>
              <Button className={styles.button}>Request Reset Link</Button>
            </Link>
          </div>
        ) : success ? (
          <div className={styles.successView}>
            <div className={styles.successAlert} role="status">
              Password reset completed successfully!
            </div>
            <p className={styles.successText}>
              Redirecting you to the login page...
            </p>
            <Button className={styles.button} onClick={() => router.push("/login")}>
              Go to Login
            </Button>
          </div>
        ) : (
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
        )}

        <div className={styles.footer}>
          <Link href="/login" className={styles.link}>
            Back to Log In
          </Link>
        </div>
      </div>
    </div>
  );
}
