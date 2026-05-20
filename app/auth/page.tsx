"use client";

import * as React from "react";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { LoginForm } from "@/components/forms/LoginForm";
import { SignUpForm } from "@/components/forms/SignUpForm";
import { ForgotPasswordForm } from "@/components/forms/ForgotPasswordForm";
import { ResetPasswordForm } from "@/components/forms/ResetPasswordForm";
import { VerifyEmailForm } from "@/components/forms/VerifyEmailForm";
import styles from "./page.module.css";

function AuthContent() {
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") || "login";
  const token = searchParams.get("token");

  const modes: Record<string, { title: string; subtitle: string; logo: string; footer: React.ReactNode }> = {
    login: {
      title: "Welcome back",
      subtitle: "Log in to access your dashboard",
      logo: "🔐",
      footer: (
        <p className={styles.footerText}>
          Don&apos;t have an account?{" "}
          <Link href="/auth?mode=register" className={styles.link}>Sign Up</Link>
        </p>
      ),
    },
    register: {
      title: "Create your account",
      subtitle: "Get started with SecureGate auth",
      logo: "🔐",
      footer: (
        <p className={styles.footerText}>
          Already have an account?{" "}
          <Link href="/auth?mode=login" className={styles.link}>Log In</Link>
        </p>
      ),
    },
    "forgot-password": {
      title: "Forgot Password",
      subtitle: "Enter your email to request a reset link",
      logo: "🔑",
      footer: (
        <Link href="/auth?mode=login" className={styles.link}>Back to Log In</Link>
      ),
    },
    "reset-password": {
      title: "Reset Password",
      subtitle: "Choose a new secure password",
      logo: "🔑",
      footer: (
        <Link href="/auth?mode=login" className={styles.link}>Back to Log In</Link>
      ),
    },
    "verify-email": {
      title: "Verify your email",
      subtitle: "Confirm your email address",
      logo: "✉️",
      footer: (
        <Link href="/auth?mode=login" className={styles.link}>Back to Log In</Link>
      ),
    },
  };

  const current = modes[mode] || modes.login;

  const renderForm = () => {
    switch (mode) {
      case "register":
        return <SignUpForm />;
      case "forgot-password":
        return <ForgotPasswordForm />;
      case "reset-password":
        return token ? <ResetPasswordForm token={token} /> : (
          <div className={styles.messageBox}>
            <div className={styles.alert} role="alert">
              Reset token is missing. Please request a new recovery email.
            </div>
            <Link href="/auth?mode=forgot-password">Request Reset Link</Link>
          </div>
        );
      case "verify-email":
        return <VerifyEmailForm token={token} />;
      default:
        return <LoginForm />;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <Link href="/" className={styles.logoLink} aria-label="Go to home page">
            <span className={styles.logo}>{current.logo}</span>
          </Link>
          <h1 className={styles.title}>{current.title}</h1>
          <p className={styles.subtitle}>{current.subtitle}</p>
        </div>

        {renderForm()}

        <div className={styles.footer}>
          {current.footer}
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.header}>
            <div className={styles.spinner} aria-hidden="true" />
          </div>
        </div>
      </div>
    }>
      <AuthContent />
    </Suspense>
  );
}
