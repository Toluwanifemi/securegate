import { z } from "zod";

export const passwordSchema = z
  .string()
  .min(8, { message: "Password must be at least 8 characters long" })
  .max(128, { message: "Password must be 128 characters or fewer" })
  .refine((val) => /[A-Z]/.test(val), {
    message: "Password must contain an uppercase letter",
  })
  .refine((val) => /[a-z]/.test(val), {
    message: "Password must contain a lowercase letter",
  })
  .refine((val) => /\d/.test(val), {
    message: "Password must contain a number",
  })
  .refine((val) => /[!@#$%^&*(),.?":{}|<>]/.test(val), {
    message: "Password must contain a special character",
  })
  .refine((val) => new TextEncoder().encode(val).length <= 72, {
    message: "Password must be 72 bytes or fewer when encoded",
  });
