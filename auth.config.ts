import type { NextAuthConfig } from "next-auth";

declare module "next-auth" {
  interface User {
    emailVerified: Date | null;
  }
}

export const authConfig = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth",
    error: "/auth",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.emailVerified = user.emailVerified;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        (session.user as { emailVerified?: Date | null }).emailVerified = token.emailVerified;
      }
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
