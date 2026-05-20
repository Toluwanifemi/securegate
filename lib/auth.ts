import NextAuth from "next-auth";
import type { DefaultSession } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import { db } from "./db";
import { LoginSchema } from "./validations/auth";
import bcryptjs from "bcryptjs";
import { authConfig } from "@/auth.config";

// Extend session user types to include the user ID in TypeScript strict mode
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(db),
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsed = LoginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const normalizedEmail = email.toLowerCase().trim();

        // Fetch user from DB
        const user = await db.user.findUnique({
          where: { email: normalizedEmail },
        });

        if (!user || !user.password) return null;

        // Compare password hash using bcryptjs
        const passwordsMatch = await bcryptjs.compare(password, user.password);
        if (!passwordsMatch) return null;

        // Return user details for JWT session placement
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          emailVerified: user.emailVerified,
        };
      },
    }),
  ],
});
export default auth;
