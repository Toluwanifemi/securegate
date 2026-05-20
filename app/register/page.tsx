import Link from "next/link";
import { SignUpForm } from "@/components/forms/SignUpForm";
import styles from "./page.module.css";

export const metadata = {
  title: "Create Account — SecureGate",
  description: "Create a secure account on the SecureGate authentication system.",
};

export default function RegisterPage() {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.logo} aria-hidden="true">🔐</div>
          <h1 className={styles.title}>Create your account</h1>
          <p className={styles.subtitle}>Get started with SecureGate auth</p>
        </div>

        <SignUpForm />

        <div className={styles.footer}>
          <p className={styles.footerText}>
            Already have an account?{" "}
            <Link href="/login" className={styles.link} id="login-redirect-link">
              Log In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
