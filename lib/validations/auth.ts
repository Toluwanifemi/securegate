import { z } from "zod";
import { passwordSchema } from "./password";

export const SignUpSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters long" }).max(100),
  email: z.string().email({ message: "Please provide a valid email address" }),
  password: passwordSchema,
});

export const LoginSchema = z.object({
  email: z.string().email({ message: "Please provide a valid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email({ message: "Please provide a valid email address" }),
});

export const ResetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, { message: "Please confirm your password" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
