import { z } from "zod";

// Regular expressions to check individual password components
export const passwordStrengthRegex = {
  hasLowercase: /[a-z]/,
  hasUppercase: /[A-Z]/,
  hasNumber: /[0-9]/,
  hasSymbol: /[^A-Za-z0-9]/,
};

// Complete combined password schema — NIST SP 800-63B aligned
// Focus on length, not composition rules
export const passwordSchema = z
  .string()
  .min(8, { message: "Password must be at least 8 characters long" })
  .max(128, { message: "Password must be 128 characters or fewer" });
