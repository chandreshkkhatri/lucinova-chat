import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcrypt-ts";
import { getUserByResetToken, updatePassword } from "@/db/queries";

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { error: "Reset token is required" },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string" || password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // Find user by valid reset token
    const user = await getUserByResetToken(token);

    if (!user || Array.isArray(user)) {
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await hash(password, 10);

    // Update password and clear reset token
    await updatePassword(user.email, hashedPassword);

    return NextResponse.json(
      { message: "Password has been reset successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "An error occurred. Please try again." },
      { status: 500 }
    );
  }
}