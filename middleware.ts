import NextAuth from "next-auth";

import { authConfig } from "@/app/(auth)/auth.config";

export default NextAuth(authConfig).auth;

export const config = {
  matcher: [
    // Match all routes except payment APIs, auth password reset APIs, static files, and public API routes
    "/((?!api/payment|api/auth/session|api/auth/forgot-password|api/auth/reset-password|_next/static|_next/image|favicon.ico|manifest.json).*)",
    "/",
    "/:id",
    "/login",
    "/register"
  ],
};
