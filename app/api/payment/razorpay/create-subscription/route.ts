import { NextRequest, NextResponse } from "next/server";

import { appConfig } from "@/lib/config";
import { ensureRazorpayClient } from "@/lib/razorpay";

function jsonError(message: string, status = 400, details?: string | object) {
  return NextResponse.json(
    { error: message, ...(details ? { details } : {}) },
    { status }
  );
}

export async function POST(request: NextRequest) {
  try {
    const rz = ensureRazorpayClient();
    if ("error" in rz) return jsonError(rz.error, 500);

    const { customerName, customerEmail, customerPhone } =
      await request.json();

    // Validate required fields
    if (!customerName || !customerEmail) {
      return NextResponse.json(
        { error: "Missing required fields: customerName and customerEmail" },
        { status: 400 }
      );
    }

    // Get or create plan ID from environment
    let planId = process.env.RAZORPAY_PLAN_ID;

    // If no plan exists, create one (typically done once during setup)
    if (!planId) {
      const currency = (
        process.env.CURRENCY ||
        appConfig.pricing.currency ||
        "INR"
      ).toUpperCase();
      const amountPaise = appConfig.pricing.proMonthlyRupees * 100;

      console.log(
        "[Create Subscription] No RAZORPAY_PLAN_ID found, creating new plan"
      );

      const plan = await rz.client.plans.create({
        period: "monthly",
        interval: 1,
        item: {
          name: "Pro Monthly Subscription",
          amount: amountPaise,
          currency,
          description: "Monthly Pro Plan subscription",
        },
      });

      planId = plan.id;
      console.log(
        "[Create Subscription] Created new plan:",
        planId,
        "- Add this to RAZORPAY_PLAN_ID in .env"
      );
    }

    // Create or get customer
    let customerId: string | undefined;

    try {
      // Try to find existing customer by email (Note: Razorpay doesn't have email search, so we'll create a new one each time)
      // In production, you should store the customer_id in your database
      const customer = await rz.client.customers.create({
        name: customerName,
        email: customerEmail,
        contact: customerPhone,
        fail_existing: "0", // Don't fail if customer exists
      });

      customerId = customer.id;
      console.log("[Create Subscription] Customer created/found:", customerId);
    } catch (error: any) {
      console.error("[Create Subscription] Customer creation failed:", error);
      return jsonError(
        "Failed to create customer",
        500,
        error.error?.description || error.message
      );
    }

    // Create subscription
    try {
      const subscription = await rz.client.subscriptions.create({
        plan_id: planId,
        customer_id: customerId,
        quantity: 1,
        total_count: 12, // 12 months, then user needs to renew
        customer_notify: 1, // Send email notification to customer
        notes: {
          customer_email: customerEmail,
          customer_name: customerName,
        },
      });

      console.log("[Create Subscription] Subscription created:", {
        subscriptionId: subscription.id,
        email: customerEmail,
        status: subscription.status,
      });

      // Return subscription details for checkout
      return NextResponse.json({
        success: true,
        subscriptionId: subscription.id,
        razorpayKeyId: process.env.RAZORPAY_KEY_ID,
        customerId,
        amount: appConfig.pricing.proMonthlyRupees * 100, // in paise
        currency: appConfig.pricing.currency,
        planId,
        environment: rz.environment,
        // Short URL for payment (if available in response)
        shortUrl: (subscription as any).short_url,
      });
    } catch (error: any) {
      console.error("[Create Subscription] Subscription creation failed:", error);
      return jsonError(
        "Failed to create subscription",
        500,
        error.error?.description || error.message
      );
    }
  } catch (error: any) {
    const details =
      error?.response?.data?.message || error?.message || "Unknown error";
    console.error("Razorpay subscription creation error:", details);
    return jsonError("Failed to create subscription", 500, details);
  }
}
