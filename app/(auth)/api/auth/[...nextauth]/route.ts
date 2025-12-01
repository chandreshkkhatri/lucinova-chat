// Re-export NextAuth route handlers from the main auth module.
// NextAuth already sets up GET/POST handlers for the dynamic auth route.
export { GET, POST } from "@/app/(auth)/auth";
