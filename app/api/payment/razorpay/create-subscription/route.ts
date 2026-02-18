import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/app/(auth)/auth";
import { ensureConnection } from "@/db/connection";
import { User } from "@/db/models";
import { getUserByEmail, hasActiveBadgeBenefit } from "@/db/queries";
import { appConfig } from "@/lib/config";
import { ensureRazorpayClient } from "@/lib/razorpay";

function jsonError(message: string, status = 400, details?: string | object) {
  return NextResponse.json(
    { error: message, ...(details ? { details } : {}) },
    { status },
  );
}

export async function POST(request: NextRequest) {
  // Verify user is authenticated
  const session = await auth();
  if (!session?.user?.email) {
    return jsonError("Unauthorized - please log in to subscribe", 401);
  }

  try {
    const rz = ensureRazorpayClient();
    if ("error" in rz) return jsonError(rz.error, 500);

    const { customerName, customerEmail, customerPhone } = await request.json();

    // Ensure the email matches the logged-in user (prevent subscribing for others)
    if (customerEmail.toLowerCase() !== session.user.email.toLowerCase()) {
      return jsonError("Email must match your account email", 400);
    }

    // Validate required fields
    if (!customerName || !customerEmail) {
      return NextResponse.json(
        { error: "Missing required fields: customerName and customerEmail" },
        { status: 400 },
      );
    }

    // Fetch user details to check for existing subscription and badges
    const user = await getUserByEmail(session.user.email);
    if (!user) {
      return jsonError("User account not found", 404);
    }

    // Get or create plan ID from environment
    let planId = process.env.RAZORPAY_PLAN_ID;

    // Verify the plan exists
    if (planId) {
      try {
        await rz.client.plans.fetch(planId);
      } catch (error: any) {
        console.error(
          "Plan does not exist:",
          planId,
          error.error?.description || error.message,
        );
        return jsonError(
          "Invalid plan configuration",
          500,
          `Plan ${planId} does not exist. Please verify RAZORPAY_PLAN_ID in your environment.`,
        );
      }
    }

    // If no plan exists, create one (typically done once during setup)
    if (!planId) {
      const currency = (
        process.env.CURRENCY ||
        appConfig.pricing.currency ||
        "USD"
      ).toUpperCase();
      const amountInCents = appConfig.pricing.proMonthlyPrice * 100;

      const plan = await rz.client.plans.create({
        period: "monthly",
        interval: 1,
        item: {
          name: "Pro Monthly Subscription",
          amount: amountInCents,
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

      // Store the Razorpay customer ID on the user record
      await ensureConnection();
      await User.findOneAndUpdate(
        { email: session.user.email.toLowerCase() },
        { razorpayCustomerId: customerId },
      );
    } catch (error: any) {
      console.error(
        "Customer creation failed:",
        error.error?.description || error.message,
      );
      return jsonError(
        "Failed to create customer",
        500,
        error.error?.description || error.message,
      );
    }

    // Create subscription
    try {
      // Check if user has active Early Bird benefit
      let useDiscountedPlan = false;
      const earlyBirdDiscountPercent = 75; // 75% off
      try {
        const hasEarlyBirdBenefit = await hasActiveBadgeBenefit(
          (user as any)._id.toString(),
          "early-bird",
          3,
        );
        if (hasEarlyBirdBenefit) {
          useDiscountedPlan = true;
          console.log(
            `[Subscription] Applying Early Bird discount (${earlyBirdDiscountPercent}% off) for ${customerEmail}`,
          );
        }
      } catch (badgeCheckError) {
        console.warn(
          "[Subscription] Could not check badge benefits:",
          badgeCheckError,
        );
        // Continue without discount rather than fail
      }

      // If early bird, create or use a discounted plan instead of using Razorpay offers
      let effectivePlanId = planId;
      if (useDiscountedPlan) {
        const discountedPlanId = process.env.RAZORPAY_EARLY_BIRD_PLAN_ID;
        if (discountedPlanId) {
          // Verify the discounted plan exists
          try {
            await rz.client.plans.fetch(discountedPlanId);
            effectivePlanId = discountedPlanId;
            console.log(
              `[Subscription] Using existing discounted plan: ${discountedPlanId}`,
            );
          } catch {
            console.warn(
              `[Subscription] Discounted plan ${discountedPlanId} not found, creating new one`,
            );
          }
        }

        // If no valid discounted plan, create one dynamically
        if (effectivePlanId === planId) {
          try {
            const currency = (
              process.env.CURRENCY ||
              appConfig.pricing.currency ||
              "USD"
            ).toUpperCase();
            const discountedAmount = Math.round(
              appConfig.pricing.proMonthlyPrice *
                100 *
                ((100 - earlyBirdDiscountPercent) / 100),
            );
            const discountedPlan = await rz.client.plans.create({
              period: "monthly",
              interval: 1,
              item: {
                name: `Pro Monthly - Early Bird (${earlyBirdDiscountPercent}% off)`,
                amount: discountedAmount,
                currency,
                description: `Early Bird discounted Pro Plan (${earlyBirdDiscountPercent}% off for first 3 months)`,
              },
            });
            effectivePlanId = discountedPlan.id;
            console.log(
              `[Subscription] Created discounted plan: ${discountedPlan.id} at ${discountedAmount} ${currency}`,
            );
          } catch (planError: any) {
            console.warn(
              "[Subscription] Failed to create discounted plan, using regular plan:",
              planError.error?.description || planError.message,
            );
            // Fall back to regular plan
          }
        }
      }

      const subscriptionParams: any = {
        plan_id: effectivePlanId,
        customer_id: customerId,
        quantity: 1,
        total_count: useDiscountedPlan ? 3 : 12, // Early bird: 3 months, then they renew at full price
        customer_notify: 1,
        notes: {
          customer_email: customerEmail,
          customer_name: customerName,
          ...(useDiscountedPlan
            ? {
                plan_type: "early-bird",
                discount_percent: String(earlyBirdDiscountPercent),
              }
            : {}),
        },
      };

      // Resubscription logic: If user has an active (but cancelled) subscription,
      // start the new subscription at the end of the current period.
      // This prevents double charging and immediate extension.
      if (
        (user as any).isPro &&
        (user as any).currentPeriodEnd &&
        new Date((user as any).currentPeriodEnd) > new Date()
      ) {
        const currentEnd = new Date((user as any).currentPeriodEnd);
        // Razorpay start_at requires Unix timestamp in seconds
        // Must be at least 15 minutes in the future
        const startAt = Math.floor(currentEnd.getTime() / 1000);
        const now = Math.floor(Date.now() / 1000);

        if (startAt > now + 15 * 60) {
          subscriptionParams.start_at = startAt;
          console.log(
            `[Subscription] Scheduled start at ${currentEnd.toISOString()} for resubscription`,
          );
        }
      }

      const subscription =
        await rz.client.subscriptions.create(subscriptionParams);

      // Return only what the client needs
      const effectivePrice = useDiscountedPlan
        ? Math.round(
            appConfig.pricing.proMonthlyPrice *
              ((100 - earlyBirdDiscountPercent) / 100) *
              100,
          )
        : appConfig.pricing.proMonthlyPrice * 100;

      return NextResponse.json({
        success: true,
        subscriptionId: subscription.id,
        razorpayKeyId: process.env.RAZORPAY_KEY_ID,
        amount: effectivePrice,
        currency: appConfig.pricing.currency,
      });
    } catch (error: any) {
      console.error(
        "Subscription creation failed:",
        error.error?.description || error.message,
      );
      return jsonError(
        "Failed to create subscription",
        500,
        error.error?.description || error.description || error.message,
      );
    }
  } catch (error: any) {
    const details =
      error?.response?.data?.message || error?.message || "Unknown error";
    console.error("Razorpay subscription creation error:", details);
    return jsonError("Failed to create subscription", 500, details);
  }
}
