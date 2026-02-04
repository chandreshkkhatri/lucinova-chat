import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/app/(auth)/auth";
import { ensureConnection } from "@/db/connection";
import { User } from "@/db/models";
import { cancelRazorpaySubscription } from "@/lib/razorpay";

function jsonError(message: string, status = 400, details?: string | object) {
  return NextResponse.json(
    { error: message, ...(details ? { details } : {}) },
    { status }
  );
}

export async function POST(request: NextRequest) {
  // Verify user is authenticated
  const session = await auth();
  if (!session?.user?.email) {
    return jsonError("Unauthorized", 401);
  }

  try {
    // Get user's subscription info
    await ensureConnection();
    const user = await User.findOne({
      email: session.user.email.toLowerCase(),
    }).lean();

    if (!user) {
      return jsonError("User not found", 404);
    }

    const subscriptionId = (user as any).subscriptionId;
    if (!subscriptionId) {
      return jsonError("No active subscription found", 400);
    }

    // Check if already canceled
    if ((user as any).subscriptionStatus === "canceled") {
      return jsonError("Subscription is already canceled", 400);
    }

    // Parse request body for cancellation options
    const body = await request.json().catch(() => ({}));
    const cancelAtCycleEnd = body.cancelAtCycleEnd !== false; // Default to true (cancel at end of billing cycle)

    // Cancel the subscription in Razorpay
    const canceledSubscription = await cancelRazorpaySubscription(
      subscriptionId,
      cancelAtCycleEnd
    );

    // Update user record
    await User.findOneAndUpdate(
      { email: session.user.email.toLowerCase() },
      { subscriptionStatus: "canceled" }
    );

    return NextResponse.json({
      success: true,
      message: cancelAtCycleEnd
        ? "Subscription will be canceled at the end of the current billing period"
        : "Subscription has been canceled immediately",
      subscriptionId,
      status: canceledSubscription.status,
    });
  } catch (error: any) {
    console.error("Subscription cancellation error:", error);
    return jsonError(
      "Failed to cancel subscription",
      500,
      error.message || "Unknown error"
    );
  }
}
