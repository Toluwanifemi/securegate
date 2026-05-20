import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  const isApiAuthRoute = nextUrl.pathname.startsWith("/api/auth");
  const isPublicRoute =
    nextUrl.pathname === "/" ||
    nextUrl.pathname === "/auth" ||
    nextUrl.pathname === "/login" ||
    nextUrl.pathname === "/register" ||
    nextUrl.pathname === "/forgot-password" ||
    nextUrl.pathname === "/forgot-password/reset" ||
    nextUrl.pathname === "/verify-email" ||
    nextUrl.pathname.startsWith("/api/"); // API endpoints are guarded separately

  // 1. NextAuth internal routes require no intervention
  if (isApiAuthRoute) {
    return NextResponse.next();
  }

  // 2. If logged in, redirect active sessions away from auth entry forms
  if (isLoggedIn && (nextUrl.pathname === "/auth" || nextUrl.pathname === "/login" || nextUrl.pathname === "/register")) {
    const mode = nextUrl.searchParams.get("mode");
    if (mode === "reset-password" || mode === "forgot-password" || mode === "verify-email") {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  // 3. Guard private routes from unauthenticated requests
  if (!isLoggedIn && !isPublicRoute) {
    let callbackUrl = nextUrl.pathname;
    if (nextUrl.search) {
      callbackUrl += nextUrl.search;
    }
    const encodedCallbackUrl = encodeURIComponent(callbackUrl);
    return NextResponse.redirect(new URL(`/auth?mode=login&callbackUrl=${encodedCallbackUrl}`, nextUrl));
  }

  // 4. Verification guard: If logged in but unverified, block dashboard access and redirect to notice page
  if (isLoggedIn && !isPublicRoute) {
    const isVerified = (req.auth?.user as any)?.emailVerified;
    if (!isVerified && nextUrl.pathname !== "/verify-email" && nextUrl.pathname !== "/auth") {
      return NextResponse.redirect(new URL("/auth?mode=verify-email", nextUrl));
    }
  }

  return NextResponse.next();
});

export const config = {
  // Catch all routes except next internals, assets, and standard favicons
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
