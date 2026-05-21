import { z } from "zod";


// Complete combined password schema — NIST SP 800-63B aligned
// Focus on length, not composition rules
export const passwordSchema = z
  .string()
  .min(8, { message: "Password must be at least 8 characters long" })
  .max(128, { message: "Password must be 128 characters or fewer" })
  .refine((val) => new TextEncoder().encode(val).length <= 72, {
    message: "Password must be 72 bytes or fewer when encoded",
  });
