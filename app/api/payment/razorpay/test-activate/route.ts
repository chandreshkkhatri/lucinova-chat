import { NextRequest, NextResponse } from "next/server";

import { activateProSubscriptionByEmail } from "@/db/queries";

/**
 * TEMPORARY TEST ENDPOINT
 * Used to manually activate Pro subscription when webhook doesn't arrive
 * DELETE THIS FILE in production
 */
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Activate Pro subscription for 30 days
    const user = await activateProSubscriptionByEmail(email, 30, "razorpay");

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Subscription activated successfully",
      user: {
        email: (user as any).email,
        plan: (user as any).plan,
        isPro: (user as any).isPro,
        currentPeriodEnd: (user as any).currentPeriodEnd,
      },
    });
  } catch (error: any) {
    console.error("[Test Activate] Error:", error);
    return NextResponse.json(
      { error: "Failed to activate subscription", details: error.message },
      { status: 500 }
    );
  }
}
