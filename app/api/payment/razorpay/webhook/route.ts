import crypto from "crypto";

import { NextRequest, NextResponse } from "next/server";

import { ensureConnection } from "@/db/connection";
import { User } from "@/db/models";
import {
  activateProSubscriptionByEmail,
  recordPaymentOnce,
  getPaymentByOrderId,
} from "@/db/queries";
import { sendSubscriptionConfirmationEmail } from "@/lib/email";
import { verifyRazorpayWebhook, ensureRazorpayClient } from "@/lib/razorpay";

export async function POST(request: NextRequest) {
  try {
    console.log("[Razorpay Webhook] ========================================");
    console.log("[Razorpay Webhook] Received webhook request at:", new Date().toISOString());
    console.log("[Razorpay Webhook] Request URL:", request.url);

    const rawBody = await request.text();
    console.log("[Razorpay Webhook] Raw body length:", rawBody.length);

    const signature = request.headers.get("x-razorpay-signature");

    if (!signature) {
      console.error("[Razorpay Webhook] Missing signature");
      return NextResponse.json(
        { error: "Missing webhook signature" },
        { status: 400 }
      );
    }

    // Verify webhook signature
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("[Razorpay Webhook] RAZORPAY_WEBHOOK_SECRET not configured");
      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 500 }
      );
    }

    const isValid = verifyRazorpayWebhook(rawBody, signature, webhookSecret);

    if (!isValid) {
      console.error("[Razorpay Webhook] Invalid signature");
      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 401 }
      );
    }

    const event = JSON.parse(rawBody);
    console.log("[Razorpay Webhook] Event received:", event.event);

    // Handle different event types
    switch (event.event) {
      case "subscription.charged":
        await handleSubscriptionCharged(event);
        break;
      case "subscription.activated":
        await handleSubscriptionActivated(event);
        break;
      case "subscription.cancelled":
        await handleSubscriptionCancelled(event);
        break;
      case "subscription.completed":
        await handleSubscriptionCompleted(event);
        break;
      case "subscription.halted":
      case "subscription.paused":
        await handleSubscriptionPaused(event);
        break;
      case "payment.failed":
        await handlePaymentFailed(event);
        break;
      default:
        console.log("[Razorpay Webhook] Unhandled event type:", event.event);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Razorpay Webhook] Processing error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

async function handleSubscriptionCharged(event: any) {
  const subscription = event.payload?.subscription?.entity;
  const payment = event.payload?.payment?.entity;

  if (!subscription || !payment) {
    console.error("[Subscription Charged] Missing subscription or payment data");
    return;
  }

  const subscriptionId = subscription.id;
  const paymentId = payment.id;
  const amount = payment.amount / 100; // Convert paise to rupees
  const currency = payment.currency || "INR";
  const customerEmail = subscription.notes?.customer_email;
  const customerName = subscription.notes?.customer_name;
  const environment =
    process.env.RAZORPAY_ENVIRONMENT === "production" ? "production" : "test";

  console.log("[Subscription Charged] Raw event payload:", JSON.stringify(event.payload, null, 2));
  console.log("[Subscription Charged] Processing payment:", {
    subscriptionId,
    paymentId,
    amount,
    amountInPaise: payment.amount,
    currency,
    customer: customerEmail,
    customerName,
  });

  // Check for duplicate payment
  const existingPayment = await getPaymentByOrderId(paymentId);
  if (existingPayment && !Array.isArray(existingPayment)) {
    if (existingPayment.status === "PAID" || existingPayment.status === "SUCCESS") {
      console.log(
        "[Subscription Charged] Duplicate webhook for payment:",
        paymentId,
        "- Already processed successfully. Skipping."
      );
      return;
    }
  }

  // If subscription notes don't include email, try fallback sources
  let effectiveEmail = customerEmail;
  let effectiveName = customerName;

  // Prefer email from payment payload
  if (!effectiveEmail && payment && payment.email) {
    effectiveEmail = payment.email;
  }

  // If still no email, try fetching customer by customer_id from subscription
  if (!effectiveEmail && subscription.customer_id) {
    try {
      const rz = ensureRazorpayClient();
      if ("error" in rz) {
        console.error("[Subscription Charged] Razorpay client init error:", rz.error);
      } else {
        try {
          // @ts-ignore - razorpay client types
          const cust = await rz.client.customers.fetch(subscription.customer_id);
          if (cust && cust.email) {
            effectiveEmail = cust.email;
          }
          if (cust && cust.name && !effectiveName) {
            effectiveName = cust.name;
          }
        } catch (err) {
          console.error("[Subscription Charged] Failed to fetch customer:", err);
        }
      }
    } catch (err) {
      console.error("[Subscription Charged] Error initializing Razorpay client:", err);
    }
  }

  if (!effectiveEmail) {
    console.error(
      "[Subscription Charged] No customer email available for subscription:",
      subscriptionId
    );
    // Still record the payment but can't activate without email
    await recordPaymentOnce({
      orderId: paymentId,
      status: "SUCCESS",
      amount,
      currency,
      customerEmail: effectiveEmail,
      customerName: effectiveName,
      environment,
      planName: "Pro Monthly Subscription",
      provider: "razorpay",
      subscriptionId,
      paymentId,
      raw: event,
    });
    return;
  }

  // Record the payment
  await recordPaymentOnce({
    orderId: paymentId,
    status: "SUCCESS",
    amount,
    currency,
    customerEmail: effectiveEmail,
    customerName: effectiveName,
    environment,
    planName: "Pro Monthly Subscription",
    provider: "razorpay",
    subscriptionId,
    paymentId,
    raw: event,
  });

  // Activate pro subscription for 30 days (monthly)
  await activateProSubscriptionByEmail(effectiveEmail, 30, "razorpay");

  // Store subscriptionId on user record for future management (cancellation, etc.)
  await ensureConnection();
  await User.findOneAndUpdate(
    { email: effectiveEmail.toLowerCase() },
    {
      subscriptionId,
      razorpayCustomerId: subscription.customer_id,
    }
  );

  // Send confirmation email
  const emailResult = await sendSubscriptionConfirmationEmail(
    effectiveEmail,
    effectiveName || effectiveEmail.split('@')[0],
    {
      planName: "Pro Monthly Subscription",
      amount,
      currency,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      subscriptionId,
      paymentId
    }
  );

  if (emailResult.success) {
    console.log(`[Subscription Charged] Confirmation email sent to ${effectiveEmail}`);
  } else {
    console.error(`[Subscription Charged] Failed to send confirmation email:`, emailResult.error);
  }
  console.log(
    "[Subscription Charged] Successfully processed subscription charge for:",
    effectiveEmail
  );
}

async function handleSubscriptionActivated(event: any) {
  const subscription = event.payload?.subscription?.entity;

  if (!subscription) {
    console.error("[Subscription Activated] Missing subscription data");
    return;
  }

  const subscriptionId = subscription.id;
  const customerEmail = subscription.notes?.customer_email;

  console.log("[Subscription Activated] Subscription activated:", {
    subscriptionId,
    customer: customerEmail,
  });

  // Note: We activate on charge, not on activation
  // This logs the event for reference
}

async function handleSubscriptionCancelled(event: any) {
  const subscription = event.payload?.subscription?.entity;

  if (!subscription) {
    console.error("[Subscription Cancelled] Missing subscription data");
    return;
  }

  const subscriptionId = subscription.id;
  const customerEmail = subscription.notes?.customer_email;

  console.log("[Subscription Cancelled] Subscription cancelled:", {
    subscriptionId,
    customer: customerEmail,
  });

  // User's subscription will automatically expire when currentPeriodEnd passes
  // No immediate action needed
}

async function handleSubscriptionCompleted(event: any) {
  const subscription = event.payload?.subscription?.entity;

  if (!subscription) {
    console.error("[Subscription Completed] Missing subscription data");
    return;
  }

  const subscriptionId = subscription.id;
  const customerEmail = subscription.notes?.customer_email;

  console.log("[Subscription Completed] Subscription completed:", {
    subscriptionId,
    customer: customerEmail,
  });

  // Subscription has reached total_count - no action needed
}

async function handleSubscriptionPaused(event: any) {
  const subscription = event.payload?.subscription?.entity;

  if (!subscription) {
    console.error("[Subscription Paused] Missing subscription data");
    return;
  }

  const subscriptionId = subscription.id;
  const customerEmail = subscription.notes?.customer_email;

  console.log("[Subscription Paused/Halted] Subscription paused:", {
    subscriptionId,
    customer: customerEmail,
  });

  // User's subscription will expire when currentPeriodEnd passes
}

async function handlePaymentFailed(event: any) {
  const payment = event.payload?.payment?.entity;

  if (!payment) {
    console.error("[Payment Failed] Missing payment data");
    return;
  }

  const paymentId = payment.id;
  const subscriptionId = payment.subscription_id;
  const amount = payment.amount / 100;
  const customerEmail = payment.email;

  console.log("[Payment Failed] Payment failed:", {
    paymentId,
    subscriptionId,
    amount,
    customer: customerEmail,
  });

  // Record failed payment
  await recordPaymentOnce({
    orderId: paymentId,
    status: "FAILED",
    amount,
    currency: payment.currency || "INR",
    customerEmail,
    environment:
      process.env.RAZORPAY_ENVIRONMENT === "production" ? "production" : "test",
    planName: "Pro Monthly Subscription",
    provider: "razorpay",
    subscriptionId,
    paymentId,
    raw: event,
  });
}
