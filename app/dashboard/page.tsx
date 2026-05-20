import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { SignOutButton } from "@/components/shared/SignOutButton";
import styles from "./page.module.css";

export const metadata = {
  title: "Dashboard — SecureGate",
  description: "SecureGate user dashboard and authentication details.",
};

export default async function DashboardPage() {
  const session = await auth();

  // Guard: Must be authenticated
  if (!session || !session.user) {
    redirect("/login");
  }

  // Fetch full user record from database to guarantee real-time verified state check
  const user = await db.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user) {
    redirect("/login");
  }

  // Guard: Must have completed email verification
  if (!user.emailVerified) {
    redirect("/verify-email");
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.logoContainer}>
          <span className={styles.logoIcon}>🔐</span>
          <span className={styles.logoText}>SecureGate</span>
        </div>
        <SignOutButton />
      </header>

      <main className={styles.main}>
        <div className={styles.welcomeBanner}>
          <h1 className={styles.welcomeTitle}>Welcome back, {user.name || "User"}!</h1>
          <p className={styles.welcomeSubtitle}>Your account is verified and secure.</p>
        </div>

        <div className={styles.grid}>
          {/* User Profile details */}
          <section className={styles.card} aria-labelledby="profile-heading">
            <h2 id="profile-heading" className={styles.cardTitle}>Profile Information</h2>
            <div className={styles.profileDetails}>
              <div className={styles.detailRow}>
                <span className={styles.label}>Name</span>
                <span className={styles.value}>{user.name || "N/A"}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.label}>Email Address</span>
                <span className={styles.value}>{user.email}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.label}>User ID</span>
                <span className={styles.valueCode}>{user.id}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.label}>Joined</span>
                <span className={styles.value}>
                  {new Date(user.createdAt).toLocaleDateString(undefined, {
                    dateStyle: "long",
                  })}
                </span>
              </div>
            </div>
          </section>

          {/* Security Diagnostics */}
          <section className={styles.card} aria-labelledby="security-heading">
            <h2 id="security-heading" className={styles.cardTitle}>Security Diagnostics</h2>
            <div className={styles.diagnosticsList}>
              <div className={styles.diagnosticItem}>
                <div className={styles.diagHeader}>
                  <span className={styles.diagIndicator} data-status="success" />
                  <span className={styles.diagName}>Session Security Strategy</span>
                </div>
                <p className={styles.diagDescription}>
                  JWT cookie sessions protected with httpOnly, secure flags, and SameSite protection.
                </p>
              </div>

              <div className={styles.diagnosticItem}>
                <div className={styles.diagHeader}>
                  <span className={styles.diagIndicator} data-status="success" />
                  <span className={styles.diagName}>Password Hashing Standards</span>
                </div>
                <p className={styles.diagDescription}>
                  Passphrases hashed using bcryptjs configure with 12 computational rounds (OWASP guideline).
                </p>
              </div>

              <div className={styles.diagnosticItem}>
                <div className={styles.diagHeader}>
                  <span className={styles.diagIndicator} data-status="success" />
                  <span className={styles.diagName}>Token Invalidation (Replay Defense)</span>
                </div>
                <p className={styles.diagDescription}>
                  Recovery and verification tokens immediately purged from the database after single-use validation.
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
