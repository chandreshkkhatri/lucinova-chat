import { NextRequest, NextResponse } from "next/server";

import {
  activateProSubscriptionByEmail,
  recordPaymentOnce,
  getPaymentByOrderId,
} from "@/db/queries";
import { ensureRazorpayClient } from "@/lib/razorpay";

/**
 * Reconciliation Cron Job
 *
 * Purpose: Automatically detect and fix missed webhooks by polling Razorpay
 *
 * What it does:
 * 1. Fetches all active Razorpay subscriptions
 * 2. For each subscription, gets recent payments (last 7 days)
 * 3. Checks if payment exists in our database
 * 4. If payment successful but user not activated → activates them
 * 5. Records the payment if missing
 *
 * How to run:
 * - Manually: GET /api/cron/reconcile-subscriptions?cron_secret=YOUR_SECRET
 * - Automated: Set up cron job (Vercel Cron, GitHub Actions, etc.)
 *
 * Security: Requires CRON_SECRET env variable to prevent unauthorized access
 *
 * Recommended frequency: Daily (or hourly for critical apps)
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  console.log("[Reconciliation] ========================================");
  console.log("[Reconciliation] Starting reconciliation job at:", new Date().toISOString());

  // Security: Verify cron secret
  const cronSecret = process.env.CRON_SECRET;
  const providedSecret = request.nextUrl.searchParams.get("cron_secret");

  if (!cronSecret) {
    console.error("[Reconciliation] CRON_SECRET not configured");
    return NextResponse.json(
      { error: "Cron secret not configured" },
      { status: 500 }
    );
  }

  if (cronSecret !== providedSecret) {
    console.error("[Reconciliation] Invalid cron secret provided");
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const rz = ensureRazorpayClient();
    if ("error" in rz) {
      console.error("[Reconciliation] Razorpay client error:", rz.error);
      return NextResponse.json(
        { error: "Razorpay client initialization failed" },
        { status: 500 }
      );
    }

    const stats = {
      subscriptionsChecked: 0,
      paymentsFound: 0,
      paymentsProcessed: 0,
      paymentsSkipped: 0,
      errors: [] as string[],
      activatedUsers: [] as string[],
    };

    // Calculate date range (last 7 days)
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    console.log("[Reconciliation] Checking payments from:", sevenDaysAgo.toISOString());

    // Fetch all subscriptions (paginated)
    // Note: Razorpay API might not have a direct "list all active subscriptions" endpoint
    // We'll use a workaround: fetch recent payments and check their subscriptions

    // Approach: Fetch all payments from last 7 days
    const fromTimestamp = Math.floor(sevenDaysAgo.getTime() / 1000);
    const toTimestamp = Math.floor(now.getTime() / 1000);

    console.log("[Reconciliation] Fetching payments from Razorpay...");

    // Fetch payments (Razorpay API: GET /payments)
    // @ts-ignore - Razorpay SDK types
    const payments = await rz.client.payments.all({
      from: fromTimestamp,
      to: toTimestamp,
      count: 100, // Adjust based on your volume
    });

    console.log(`[Reconciliation] Found ${payments.items?.length || 0} payments from Razorpay`);

    if (!payments.items || payments.items.length === 0) {
      console.log("[Reconciliation] No payments found in the last 7 days");
      return NextResponse.json({
        success: true,
        message: "No payments to reconcile",
        stats,
        duration: Date.now() - startTime,
      });
    }

    // Process each payment
    for (const payment of payments.items) {
      stats.paymentsFound++;

      try {
        // Only process captured/successful payments
        if (payment.status !== "captured") {
          console.log(`[Reconciliation] Skipping payment ${payment.id} - status: ${payment.status}`);
          stats.paymentsSkipped++;
          continue;
        }

        // Check if payment is for a subscription
        if (!payment.subscription_id) {
          console.log(`[Reconciliation] Skipping payment ${payment.id} - not a subscription payment`);
          stats.paymentsSkipped++;
          continue;
        }

        const paymentId = payment.id;
        const subscriptionId = payment.subscription_id;
        const amount = payment.amount / 100; // Convert paise to rupees
        const currency = payment.currency || "INR";

        console.log(`[Reconciliation] Processing payment ${paymentId} for subscription ${subscriptionId}`);

        // Check if payment already exists in our database
        const existingPayment = await getPaymentByOrderId(paymentId);

        if (existingPayment && !Array.isArray(existingPayment)) {
          if (existingPayment.status === "SUCCESS" || existingPayment.status === "PAID") {
            console.log(`[Reconciliation] Payment ${paymentId} already processed - skipping`);
            stats.paymentsSkipped++;
            continue;
          }
        }

        // Payment is successful but not in our database or not marked as success
        // This means we missed the webhook!
        console.log(`[Reconciliation] 🚨 MISSED WEBHOOK DETECTED for payment ${paymentId}`);

        // Fetch subscription details to get customer email
        // @ts-ignore
        const subscription = await rz.client.subscriptions.fetch(subscriptionId);

        let customerEmail = subscription.notes?.customer_email;
        let customerName = subscription.notes?.customer_name;

        // Fallback: Get email from payment
        if (!customerEmail && payment.email) {
          customerEmail = payment.email;
        }

        // Fallback: Get email from customer
        if (!customerEmail && subscription.customer_id) {
          try {
            // @ts-ignore
            const customer = await rz.client.customers.fetch(subscription.customer_id);
            customerEmail = customer.email;
            if (!customerName && customer.name) {
              customerName = customer.name;
            }
          } catch (err) {
            console.error(`[Reconciliation] Failed to fetch customer ${subscription.customer_id}:`, err);
          }
        }

        if (!customerEmail) {
          console.error(`[Reconciliation] No email found for payment ${paymentId} - cannot activate`);
          stats.errors.push(`Payment ${paymentId}: No email found`);
          continue;
        }

        console.log(`[Reconciliation] Activating subscription for ${customerEmail}`);

        // Record the payment
        await recordPaymentOnce({
          orderId: paymentId,
          status: "SUCCESS",
          amount,
          currency,
          customerEmail,
          customerName,
          environment: rz.environment,
          planName: "Pro Monthly Subscription",
          provider: "razorpay",
          subscriptionId,
          paymentId,
          raw: {
            payment,
            subscription,
            reconciled: true,
            reconciledAt: new Date().toISOString(),
          },
        });

        // Activate Pro subscription for 30 days
        await activateProSubscriptionByEmail(customerEmail, 30, "razorpay");

        stats.paymentsProcessed++;
        stats.activatedUsers.push(customerEmail);

        console.log(`[Reconciliation] ✅ Successfully activated ${customerEmail}`);

      } catch (error: any) {
        console.error(`[Reconciliation] Error processing payment ${payment.id}:`, error);
        stats.errors.push(`Payment ${payment.id}: ${error.message}`);
      }
    }

    const duration = Date.now() - startTime;

    console.log("[Reconciliation] ========================================");
    console.log("[Reconciliation] Job completed in", duration, "ms");
    console.log("[Reconciliation] Stats:", stats);

    return NextResponse.json({
      success: true,
      message: "Reconciliation completed",
      stats,
      duration,
    });

  } catch (error: any) {
    console.error("[Reconciliation] Fatal error:", error);
    return NextResponse.json(
      {
        error: "Reconciliation failed",
        message: error.message,
        duration: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}
