import NextAuth from "next-auth";

import { authConfig } from "@/app/(auth)/auth.config";

export default NextAuth(authConfig).auth;

export const config = {
  matcher: [
    // Match all routes except payment APIs, static files, and public API routes
    "/((?!api/payment|api/auth/session|_next/static|_next/image|favicon.ico|manifest.json).*)",
    "/",
    "/:id",
    "/login",
    "/register"
  ],
};
