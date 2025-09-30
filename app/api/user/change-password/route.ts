import { NextRequest, NextResponse } from "next/server";
import { hash, compare } from "bcrypt-ts";
import { auth } from "@/app/(auth)/auth";
import { getUserByEmail, updatePassword } from "@/db/queries";

export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { currentPassword, newPassword } = await request.json();

    // Validate inputs
    if (!currentPassword || typeof currentPassword !== "string") {
      return NextResponse.json(
        { error: "Current password is required" },
        { status: 400 }
      );
    }

    if (!newPassword || typeof newPassword !== "string" || newPassword.length < 6) {
      return NextResponse.json(
        { error: "New password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // Get user from database
    const user = await getUserByEmail(session.user.email);

    if (!user || Array.isArray(user)) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Verify current password
    if (!user.password) {
      return NextResponse.json(
        { error: "Password not set for this account" },
        { status: 400 }
      );
    }

    const isValidPassword = await compare(currentPassword, user.password);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await hash(newPassword, 10);

    // Update password
    await updatePassword(user.email, hashedPassword);

    return NextResponse.json(
      { message: "Password changed successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Change password error:", error);
    return NextResponse.json(
      { error: "An error occurred. Please try again." },
      { status: 500 }
    );
  }
}