import { NextRequest, NextResponse } from "next/server";

import { appConfig } from "@/lib/config";
import { ensureRazorpayClient } from "@/lib/razorpay";
import { getUserByEmail, hasActiveBadgeBenefit } from "@/db/queries";

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

    // Verify the plan exists
    if (planId) {
      try {
        await rz.client.plans.fetch(planId);
      } catch (error: any) {
        console.error("Plan does not exist:", planId, error.error?.description || error.message);
        return jsonError(
          "Invalid plan configuration",
          500,
          `Plan ${planId} does not exist. Please verify RAZORPAY_PLAN_ID in your environment.`
        );
      }
    }

    // If no plan exists, create one (typically done once during setup)
    if (!planId) {
      const currency = (
        process.env.CURRENCY ||
        appConfig.pricing.currency ||
        "INR"
      ).toUpperCase();
      const amountPaise = appConfig.pricing.proMonthlyRupees * 100;

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
    }

    // Create or get customer
    let customerId: string | undefined;

    try {
      const customer = await rz.client.customers.create({
        name: customerName,
        email: customerEmail,
        contact: customerPhone,
        fail_existing: "0",
      });

      customerId = customer.id;

      // Verify customer was created successfully
      try {
        await rz.client.customers.fetch(customerId);
      } catch (verifyError: any) {
        console.error("Customer verification failed:", verifyError);
        throw new Error("Customer was created but cannot be verified");
      }
    } catch (error: any) {
      console.error("Customer creation failed:", error.error?.description || error.message);
      return jsonError(
        "Failed to create customer",
        500,
        error.error?.description || error.message
      );
    }

    // Create subscription
    try {
      // Check if user has active Early Bird benefit
      let offerId: string | undefined;
      try {
        const user = await getUserByEmail(customerEmail);
        if (user) {
          const hasEarlyBirdBenefit = await hasActiveBadgeBenefit(
            user._id.toString(),
            "early-bird",
            3
          );
          if (hasEarlyBirdBenefit) {
            offerId = process.env.RAZORPAY_EARLY_BIRD_OFFER_ID;
            console.log(
              `[Subscription] Applying Early Bird discount for ${customerEmail}`
            );
          }
        }
      } catch (badgeCheckError) {
        console.warn(
          "[Subscription] Could not check badge benefits:",
          badgeCheckError
        );
        // Continue without discount rather than fail
      }

      const subscriptionParams: any = {
        plan_id: planId,
        customer_id: customerId,
        quantity: 1,
        total_count: 12,
        customer_notify: 1,
        notes: {
          customer_email: customerEmail,
          customer_name: customerName,
        },
      };

      // Add offer if user has Early Bird badge benefit
      if (offerId) {
        subscriptionParams.offer_id = offerId;
      }

      const subscription = await rz.client.subscriptions.create(
        subscriptionParams
      );

      return NextResponse.json({
        success: true,
        subscriptionId: subscription.id,
        razorpayKeyId: process.env.RAZORPAY_KEY_ID,
        customerId,
        amount: appConfig.pricing.proMonthlyRupees * 100,
        currency: appConfig.pricing.currency,
        planId,
        environment: rz.environment,
        shortUrl: (subscription as any).short_url,
      });
    } catch (error: any) {
      console.error("Subscription creation failed:", error.error?.description || error.message);
      return jsonError(
        "Failed to create subscription",
        500,
        error.error?.description || error.description || error.message
      );
    }
  } catch (error: any) {
    const details =
      error?.response?.data?.message || error?.message || "Unknown error";
    console.error("Razorpay subscription creation error:", details);
    return jsonError("Failed to create subscription", 500, details);
  }
}
