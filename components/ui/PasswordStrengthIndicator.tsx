"use client";

import * as React from "react";
import styles from "./PasswordStrengthIndicator.module.css";

interface PasswordStrengthIndicatorProps {
  password: string;
  isFocused?: boolean;
}

const requirements = [
  { label: "must contain an uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "must contain a lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { label: "must contain a number", test: (p: string) => /\d/.test(p) },
  { label: "must contain a special character", test: (p: string) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
  { label: "minimum of 8 characters", test: (p: string) => p.length >= 8 },
];

export function PasswordStrengthIndicator({ password, isFocused }: PasswordStrengthIndicatorProps) {
  if (!password && !isFocused) return null;

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

  const firstUnmet = requirements.find((r) => !r.test(password));

  return (
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

      {firstUnmet && (
        <ul className={styles.criteriaList} aria-label="Password requirements">
          <li className={styles.criteriaPending}>{firstUnmet.label}</li>
        </ul>
      )}
    </div>
  );
}

export default PasswordStrengthIndicator;
