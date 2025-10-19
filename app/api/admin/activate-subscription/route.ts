import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/app/(auth)/auth";
import {
  activateProSubscriptionByEmail,
  recordPaymentOnce,
  getPaymentByOrderId,
  getUserByEmail,
} from "@/db/queries";
import { ensureRazorpayClient } from "@/lib/razorpay";

/**
 * Manual Subscription Activation Endpoint
 *
 * Purpose: Allow support team to manually activate subscriptions
 *
 * Use cases:
 * - User paid but webhook was missed
 * - Emergency activation needed
 * - Manual correction of subscription status
 *
 * Security:
 * - Requires authentication
 * - Requires admin role (or ADMIN_SECRET for emergency access)
 *
 * Usage:
 * POST /api/admin/activate-subscription
 * Body: {
 *   email: "user@example.com",           // User to activate
 *   paymentId: "pay_xyz123",             // Optional: Razorpay payment ID to verify
 *   subscriptionId: "sub_xyz123",        // Optional: Razorpay subscription ID
 *   adminSecret: "secret",               // Required if not authenticated
 *   periodInDays: 30,                    // Optional: Override default 30 days
 *   skipVerification: false,             // Optional: Skip payment verification
 * }
 */

interface ActivationRequest {
  email: string;
  paymentId?: string;
  subscriptionId?: string;
  adminSecret?: string;
  periodInDays?: number;
  skipVerification?: boolean;
}

export async function POST(request: NextRequest) {
  console.log("[Admin Activate] ========================================");
  console.log("[Admin Activate] Request received at:", new Date().toISOString());

  try {
    const body: ActivationRequest = await request.json();
    const { email, paymentId, subscriptionId, adminSecret, periodInDays = 30, skipVerification = false } = body;

    // Validation
    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Security: Check authentication or admin secret
    const session = await auth();
    const configuredAdminSecret = process.env.ADMIN_SECRET;

    const isAuthenticated = !!session?.user?.email;
    const hasValidAdminSecret = configuredAdminSecret && adminSecret === configuredAdminSecret;

    if (!isAuthenticated && !hasValidAdminSecret) {
      console.error("[Admin Activate] Unauthorized access attempt");
      return NextResponse.json(
        { error: "Unauthorized. Please authenticate or provide admin secret." },
        { status: 401 }
      );
    }

    console.log("[Admin Activate] Authorized request from:", session?.user?.email || "admin secret");

    // Check if user exists
    const user = await getUserByEmail(email);
    if (!user) {
      console.error("[Admin Activate] User not found:", email);
      return NextResponse.json(
        { error: `User not found: ${email}` },
        { status: 404 }
      );
    }

    console.log("[Admin Activate] Current user status:", {
      email: user.email,
      plan: user.plan,
      isPro: user.isPro,
      currentPeriodEnd: user.currentPeriodEnd,
      subscriptionStatus: user.subscriptionStatus,
    });

    const activationDetails: any = {
      email,
      activatedBy: session?.user?.email || "admin",
      activatedAt: new Date().toISOString(),
    };

    // If payment ID provided, verify the payment
    if (paymentId && !skipVerification) {
      console.log("[Admin Activate] Verifying payment:", paymentId);

      const rz = ensureRazorpayClient();
      if ("error" in rz) {
        return NextResponse.json(
          { error: "Razorpay client initialization failed" },
          { status: 500 }
        );
      }

      try {
        // Fetch payment from Razorpay
        // @ts-ignore
        const payment = await rz.client.payments.fetch(paymentId);

        console.log("[Admin Activate] Payment details:", {
          id: payment.id,
          status: payment.status,
          amount: payment.amount,
          currency: payment.currency,
          email: payment.email,
          subscription_id: payment.subscription_id,
        });

        // Verify payment is successful
        if (payment.status !== "captured") {
          return NextResponse.json(
            {
              error: `Payment ${paymentId} status is ${payment.status}, not captured. Cannot activate.`,
              payment: {
                id: payment.id,
                status: payment.status,
                amount: payment.amount / 100,
              },
            },
            { status: 400 }
          );
        }

        // Check if payment already processed
        const existingPayment = await getPaymentByOrderId(paymentId);
        if (existingPayment && !Array.isArray(existingPayment)) {
          if (existingPayment.status === "SUCCESS" || existingPayment.status === "PAID") {
            console.log("[Admin Activate] Payment already processed");
            activationDetails.paymentAlreadyProcessed = true;
          }
        } else {
          // Record the payment
          console.log("[Admin Activate] Recording payment");
          const amount = payment.amount / 100;
          const currency = payment.currency || "INR";

          await recordPaymentOnce({
            orderId: paymentId,
            status: "SUCCESS",
            amount,
            currency,
            customerEmail: email,
            customerName: user.name,
            environment: rz.environment,
            planName: "Pro Monthly Subscription",
            provider: "razorpay",
            subscriptionId: payment.subscription_id || subscriptionId,
            paymentId,
            raw: {
              payment,
              manualActivation: true,
              activatedBy: session?.user?.email || "admin",
            },
          });

          activationDetails.paymentRecorded = true;
          activationDetails.amount = amount;
          activationDetails.currency = currency;
        }

        activationDetails.paymentVerified = true;
        activationDetails.paymentId = paymentId;

      } catch (error: any) {
        console.error("[Admin Activate] Error fetching payment:", error);
        return NextResponse.json(
          {
            error: `Failed to verify payment: ${error.message}`,
            paymentId,
          },
          { status: 500 }
        );
      }
    }

    // If subscription ID provided, fetch subscription details
    if (subscriptionId && !skipVerification) {
      console.log("[Admin Activate] Verifying subscription:", subscriptionId);

      const rz = ensureRazorpayClient();
      if ("error" in rz) {
        return NextResponse.json(
          { error: "Razorpay client initialization failed" },
          { status: 500 }
        );
      }

      try {
        // @ts-ignore
        const subscription = await rz.client.subscriptions.fetch(subscriptionId);

        console.log("[Admin Activate] Subscription details:", {
          id: subscription.id,
          status: subscription.status,
          plan_id: subscription.plan_id,
          customer_id: subscription.customer_id,
        });

        activationDetails.subscriptionVerified = true;
        activationDetails.subscriptionId = subscriptionId;
        activationDetails.subscriptionStatus = subscription.status;

      } catch (error: any) {
        console.error("[Admin Activate] Error fetching subscription:", error);
        return NextResponse.json(
          {
            error: `Failed to verify subscription: ${error.message}`,
            subscriptionId,
          },
          { status: 500 }
        );
      }
    }

    // Activate the subscription
    console.log(`[Admin Activate] Activating subscription for ${email} - ${periodInDays} days`);

    const updatedUser = await activateProSubscriptionByEmail(email, periodInDays, "razorpay");

    if (!updatedUser || Array.isArray(updatedUser)) {
      console.error("[Admin Activate] Failed to activate subscription");
      return NextResponse.json(
        { error: "Failed to activate subscription" },
        { status: 500 }
      );
    }

    console.log("[Admin Activate] ✅ Successfully activated subscription");
    console.log("[Admin Activate] Updated user status:", {
      email: updatedUser.email,
      plan: updatedUser.plan,
      isPro: updatedUser.isPro,
      currentPeriodEnd: updatedUser.currentPeriodEnd,
      subscriptionStatus: updatedUser.subscriptionStatus,
    });

    return NextResponse.json({
      success: true,
      message: `Successfully activated Pro subscription for ${email}`,
      user: {
        email: updatedUser.email,
        plan: updatedUser.plan,
        isPro: updatedUser.isPro,
        currentPeriodEnd: updatedUser.currentPeriodEnd,
        subscriptionStatus: updatedUser.subscriptionStatus,
        subscriptionProvider: updatedUser.subscriptionProvider,
      },
      activationDetails,
    });

  } catch (error: any) {
    console.error("[Admin Activate] Error:", error);
    return NextResponse.json(
      {
        error: "Activation failed",
        message: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to check current subscription status
 */
export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get("email");
    const adminSecret = request.nextUrl.searchParams.get("admin_secret");

    if (!email) {
      return NextResponse.json(
        { error: "Email parameter is required" },
        { status: 400 }
      );
    }

    // Security check
    const session = await auth();
    const configuredAdminSecret = process.env.ADMIN_SECRET;

    const isAuthenticated = !!session?.user?.email;
    const hasValidAdminSecret = configuredAdminSecret && adminSecret === configuredAdminSecret;

    if (!isAuthenticated && !hasValidAdminSecret) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await getUserByEmail(email);

    if (!user) {
      return NextResponse.json(
        { error: `User not found: ${email}` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        email: user.email,
        plan: user.plan,
        isPro: user.isPro,
        currentPeriodEnd: user.currentPeriodEnd,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionProvider: user.subscriptionProvider,
        proSince: user.proSince,
      },
    });

  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Failed to fetch user status",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
