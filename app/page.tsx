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
          {isLoggedIn ? (
            <Link href="/dashboard" className={styles.navLink}>
              Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className={styles.navLink}>
                Log In
              </Link>
              <Link href="/register" className={styles.navLink}>
                Sign Up
              </Link>
            </>
          )}
        </div>
      </header>

      <main className={styles.heroSection}>
        <div className={styles.heroContent}>
          <span className={styles.badge}>PRODUCTION-READY AUTHENTICATION</span>
          <h1 className={styles.heroTitle}>
            Secure, Plug-and-Play Authentication for Next.js
          </h1>
          <p className={styles.heroSubtitle}>
            A self-hostable gateway built on security-first architectures.
            Aligned with OWASP and NIST guidelines, using NextAuth.js, Prisma, and PostgreSQL.
          </p>

          <div className={styles.ctaContainer}>
            {isLoggedIn ? (
              <Link href="/dashboard" className={styles.ctaLink}>
                <Button size="lg" className={styles.ctaButton}>
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/register" className={styles.ctaLink}>
                  <Button size="lg" className={styles.ctaButton}>
                    Get Started
                  </Button>
                </Link>
                <Link href="/login" className={styles.ctaLink}>
                  <Button size="lg" variant="outline" className={styles.ctaButton}>
                    Log In
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <section className={styles.featuresSection} aria-labelledby="features-heading">
          <h2 id="features-heading" className={styles.sectionTitle}>Security Highlights</h2>
          <div className={styles.featuresGrid}>
            <div className={styles.featureCard}>
              <span className={styles.featureIcon}>🛡️</span>
              <h3 className={styles.featureTitle}>OWASP & NIST Aligned</h3>
              <p className={styles.featureText}>
                Utilizes secure cryptographic password hashing, strict input validation, and secure JWT token protocols.
              </p>
            </div>

            <div className={styles.featureCard}>
              <span className={styles.featureIcon}>⚡</span>
              <h3 className={styles.featureTitle}>Low-Friction Setup</h3>
              <p className={styles.featureText}>
                Complete self-contained signup, email verification, credentials authentication, and password reset flows.
              </p>
            </div>

            <div className={styles.featureCard}>
              <span className={styles.featureIcon}>🚦</span>
              <h3 className={styles.featureTitle}>Rate Limiting</h3>
              <p className={styles.featureText}>
                Brute-force mitigation on entry points utilizing Upstash sliding-window rate limiters.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <p className={styles.footerText}>
          &copy; {new Date().getFullYear()} SecureGate. All rights reserved. Self-hostable auth.
        </p>
      </footer>
    </div>
  );
}
