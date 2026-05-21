import type { NextAuthConfig } from "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    emailVerified: Date | null;
  }
  interface Session {
    user: {
      id: string;
      emailVerified: Date | null;
    } & import("next-auth").DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
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
        token.id = user.id || "";
        token.emailVerified = user.emailVerified;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.emailVerified = token.emailVerified;
      }
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
