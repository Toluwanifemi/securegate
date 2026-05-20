"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import styles from "./page.module.css";

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [verifying, setVerifying] = React.useState(!!token);
  const [status, setStatus] = React.useState<"idle" | "success" | "error">(token ? "idle" : "idle");
  const [message, setMessage] = React.useState("");

  // Resend email workflow states
  const [resendEmail, setResendEmail] = React.useState("");
  const [resending, setResending] = React.useState(false);
  const [resendMessage, setResendMessage] = React.useState("");
  const [resendError, setResendError] = React.useState("");

  // Execute token verification on load if token exists in URL
  React.useEffect(() => {
    if (!token) return;

    const verifyToken = async () => {
      try {
        const response = await fetch("/api/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (response.ok) {
          setStatus("success");
          setMessage("Email verified successfully! Redirecting to login...");
          setTimeout(() => {
            router.push("/login?verified=true");
          }, 3000);
        } else {
          setStatus("error");
          setMessage(data.message || "Invalid or expired verification token.");
        }
      } catch {
        setStatus("error");
        setMessage("An unexpected error occurred during verification.");
      } finally {
        setVerifying(false);
      }
    };

    verifyToken();
  }, [token, router]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail) {
      setResendError("Please enter your email address.");
      return;
    }

    setResending(true);
    setResendMessage("");
    setResendError("");

    try {
      const response = await fetch("/api/verify-email/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resendEmail }),
      });

      const data = await response.json();

      if (response.ok) {
        setResendMessage(data.message || "Verification link sent successfully.");
        setResendEmail("");
      } else {
        setResendError(data.message || "Failed to resend verification email.");
      }
    } catch {
      setResendError("An unexpected error occurred. Please try again.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.logo} aria-hidden="true">✉️</div>

        {verifying && (
          <div className={styles.center}>
            <span className={styles.spinner} aria-hidden="true" />
            <h1 className={styles.title}>Verifying your email</h1>
            <p className={styles.subtitle}>Please wait while we confirm your account.</p>
          </div>
        )}

        {!verifying && status === "success" && (
          <div className={styles.center}>
            <h1 className={`${styles.title} ${styles.success}`}>Success!</h1>
            <p className={styles.subtitle}>{message}</p>
            <Button className={styles.button} onClick={() => router.push("/login")}>
              Go to Login
            </Button>
          </div>
        )}

        {!verifying && status === "error" && (
          <div className={styles.center}>
            <h1 className={`${styles.title} ${styles.error}`}>Verification Failed</h1>
            <p className={styles.subtitle}>{message}</p>
            <div className={styles.divider} />
            <h2 className={styles.formTitle}>Request a new link</h2>
            <form onSubmit={handleResend} className={styles.form} noValidate>
              {resendMessage && <div className={styles.successAlert}>{resendMessage}</div>}
              {resendError && <div className={styles.alert}>{resendError}</div>}
              <Input
                label="Email Address"
                type="email"
                placeholder="you@example.com"
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
                disabled={resending}
                required
              />
              <Button type="submit" className={styles.button} isLoading={resending}>
                Resend Link
              </Button>
            </form>
          </div>
        )}

        {!verifying && !token && (
          <div className={styles.center}>
            <h1 className={styles.title}>Verify your email</h1>
            <p className={styles.subtitle}>
              Your account is registered but unverified. Please check your inbox for a verification email.
            </p>
            <div className={styles.divider} />
            <h2 className={styles.formTitle}>Resend verification link</h2>
            <form onSubmit={handleResend} className={styles.form} noValidate>
              {resendMessage && <div className={styles.successAlert}>{resendMessage}</div>}
              {resendError && <div className={styles.alert}>{resendError}</div>}
              <Input
                label="Email Address"
                type="email"
                placeholder="you@example.com"
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
                disabled={resending}
                required
              />
              <Button type="submit" className={styles.button} isLoading={resending}>
                Resend Link
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
