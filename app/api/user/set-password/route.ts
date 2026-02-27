import { hash } from "bcrypt-ts";
import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/app/(auth)/auth";
import { getUserByEmail, updatePassword } from "@/db/queries";

/**
 * POST /api/user/set-password
 * Allows OAuth-only users (who have no password) to set an initial password
 * so they can also log in with email + password.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { newPassword } = await request.json();

    if (!newPassword || typeof newPassword !== "string" || newPassword.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 },
      );
    }

    const user = await getUserByEmail(session.user.email);
    if (!user || Array.isArray(user)) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Only allow this endpoint for users who do NOT already have a password
    if (user.password) {
      return NextResponse.json(
        { error: "Password already set. Use change-password instead." },
        { status: 400 },
      );
    }

    const hashedPassword = await hash(newPassword, 10);
    await updatePassword(user.email, hashedPassword);

    return NextResponse.json(
      { message: "Password set successfully. You can now log in with email and password." },
      { status: 200 },
    );
  } catch (error) {
    console.error("Set password error:", error);
    return NextResponse.json(
      { error: "An error occurred. Please try again." },
      { status: 500 },
    );
  }
}
