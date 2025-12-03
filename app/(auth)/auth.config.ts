import { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
    newUser: "/",
    error: "/login", // Redirect errors back to login page
  },
  providers: [
    // added later in auth.ts since it requires bcrypt which is only compatible with Node.js
    // while this file is also used in non-Node.js environments
  ],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const pathname = nextUrl.pathname;

      // Public routes that don't require authentication
      const publicRoutes = ["/login", "/register", "/forgot-password", "/reset-password", "/chat", "/pricing", "/legal", "/privacy", "/contact"];
      const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route)) || pathname === "/";

      // Redirect logged-in users away from auth pages
      if (isLoggedIn && (pathname.startsWith("/login") || pathname.startsWith("/register"))) {
        return Response.redirect(new URL("/", nextUrl));
      }

      // Allow access to public routes
      if (isPublicRoute) {
        return true;
      }

      // All other routes require authentication
      if (!isLoggedIn) {
        return false; // Redirect to login
      }

      return true;
    },
  },
} satisfies NextAuthConfig;
