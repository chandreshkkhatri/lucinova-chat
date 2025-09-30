import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getUserByEmail, setPasswordResetToken } from "@/db/queries";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await getUserByEmail(email);

    // Always return success to prevent email enumeration
    // but only send email if user exists
    if (user) {
      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString("hex");
      const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

      // Save token to database
      await setPasswordResetToken(email, resetToken, resetTokenExpiry);

      // Generate reset URL
      const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/reset-password?token=${resetToken}`;

      // Send password reset email
      const emailResult = await sendPasswordResetEmail(
        email,
        resetUrl,
        user.displayName
      );

      if (!emailResult.success) {
        console.error("Failed to send password reset email:", emailResult.error);
        // Log the reset URL as fallback for development
        console.log(`Password reset link for ${email}: ${resetUrl}`);
      }
    }

    // Always return success to prevent email enumeration
    return NextResponse.json(
      {
        message: "If an account with that email exists, a password reset link has been sent.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "An error occurred. Please try again." },
      { status: 500 }
    );
  }
}