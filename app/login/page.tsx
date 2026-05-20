import Link from "next/link";
import { LoginForm } from "@/components/forms/LoginForm";
import styles from "./page.module.css";

export const metadata = {
  title: "Log In — SecureGate",
  description: "Sign in to your SecureGate account.",
};

export default function LoginPage() {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.logo} aria-hidden="true">🔐</div>
          <h1 className={styles.title}>Welcome back</h1>
          <p className={styles.subtitle}>Log in to access your dashboard</p>
        </div>

        <LoginForm />

        <div className={styles.footer}>
          <p className={styles.footerText}>
            Don&apos;t have an account?{" "}
            <Link href="/register" className={styles.link} id="signup-redirect-link">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
