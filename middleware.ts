import NextAuth from "next-auth";

import { authConfig } from "@/app/(auth)/auth.config";

export default NextAuth(authConfig).auth;

export const config = {
  matcher: [
    // Match all routes except auth APIs, payment APIs, chat API, auth password reset APIs, static files, fonts, images, and public routes
    // IMPORTANT: Exclude all `/api/auth/*` so that NextAuth's own API routes (sign-in, callback, etc.) work correctly.
    "/((?!api/auth/|api/payment|api/chat|_next/static|_next/image|favicon.ico|manifest.json|fonts/|images/|.well-known/).*)",
    "/",
    "/:id",
    "/login",
    "/register"
  ],
};
