import Link from "next/link";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/Button";
import styles from "./page.module.css";

export const metadata = {
  title: "SecureGate — Self-Hostable Authentication System",
  description: "Secure, production-ready credentials portal built with Next.js 14.",
};

export default async function LandingPage() {
  const session = await auth();
  const isLoggedIn = !!session?.user;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.logoContainer}>
          <span className={styles.logoIcon}>🔐</span>
          <span className={styles.logoText}>SecureGate</span>
        </div>
        <div className={styles.headerActions}>
          {isLoggedIn && (
            <Link href="/dashboard" className={styles.navLink}>
              Dashboard
            </Link>
          )}
        </div>
      </header>

      <main className={styles.heroSection}>
        <div className={styles.heroContent}>
          <span className={styles.badge}>PRODUCTION-READY AUTHENTICATION</span>
          <h1 className={styles.heroTitle}>
            Authentication You Control. Security You Can Trust
          </h1>
          <p className={styles.heroSubtitle}>
            Build and control your authentication without relying on third-party services—secure, simple, and ready to deploy
          </p>

          <div className={styles.ctaContainer}>
            {isLoggedIn ? (
              <Link href="/dashboard" className={styles.ctaLink}>
                <Button size="lg" className={styles.ctaButton}>
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <Link href="/register" className={styles.ctaLink}>
                <Button size="lg" className={styles.ctaButton}>
                  Get Started
                </Button>
              </Link>
            )}
          </div>
        </div>
      </main>

      <footer className={styles.footer}>
        <p className={styles.footerText}>
          &copy; {new Date().getFullYear()} SecureGate. Self-hostable auth.
        </p>
      </footer>
    </div>
  );
}
