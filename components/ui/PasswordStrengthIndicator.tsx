"use client";

import * as React from "react";
import styles from "./PasswordStrengthIndicator.module.css";

interface PasswordStrengthIndicatorProps {
  password: string;
}

export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  if (!password || password.length === 0) return null;

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
      
      <ul className={styles.criteriaList} aria-label="Password requirements">
        <li className={password.length >= 8 ? styles.criteriaCheck : styles.criteriaCross}>
          At least 8 characters
        </li>
      </ul>
    </div>
  );
}
