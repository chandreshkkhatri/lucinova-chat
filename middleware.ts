import NextAuth from "next-auth";

import { authConfig } from "@/app/(auth)/auth.config";

export default NextAuth(authConfig).auth;

export const config = {
  matcher: [
    // Match all routes except payment APIs, chat API, auth password reset APIs, static files, fonts, images, and public routes
    "/((?!api/payment|api/chat|api/auth/session|api/auth/forgot-password|api/auth/reset-password|_next/static|_next/image|favicon.ico|manifest.json|fonts/|images/|.well-known/).*)",
    "/",
    "/:id",
    "/login",
    "/register"
  ],
};
