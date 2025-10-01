import crypto from "crypto";

import { NextRequest, NextResponse } from "next/server";

import {
  activateProSubscriptionByEmail,
  recordPaymentOnce,
  getPaymentByOrderId,
} from "@/db/queries";

export async function POST(request: NextRequest) {
  try {
    console.log("[Webhook] Received webhook request");
    const rawBody = await request.text();
    const signature = request.headers.get("x-webhook-signature");
    const timestamp = request.headers.get("x-webhook-timestamp");

    if (!signature || !timestamp) {
      console.error("[Webhook] Missing signature or timestamp");
      return NextResponse.json(
        { error: "Missing webhook signature or timestamp" },
        { status: 400 }
      );
    }

    // Verify webhook signature
    const webhookSecret = process.env.CASHFREE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("[Webhook] CASHFREE_WEBHOOK_SECRET not configured");
      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 500 }
      );
    }

    const generatedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(timestamp + rawBody)
      .digest("base64");

    if (signature !== generatedSignature) {
      console.error(
        "[Webhook] Invalid signature. Expected:",
        generatedSignature.substring(0, 10) + "...",
        "Got:",
        signature.substring(0, 10) + "..."
      );
      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 401 }
      );
    }

    const event = JSON.parse(rawBody);
    console.log(
      "[Webhook] Event received:",
      event.type,
      "Order ID:",
      event.data?.order?.order_id || event.data?.payment?.order_id
    );

    // Handle different event types
    switch (event.type) {
      case "PAYMENT_SUCCESS_WEBHOOK":
        await handlePaymentSuccess(event);
        break;
      case "PAYMENT_FAILED_WEBHOOK":
        await handlePaymentFailure(event);
        break;
      case "PAYMENT_USER_DROPPED_WEBHOOK":
        await handlePaymentDropped(event);
        break;
      default:
        console.log("Unhandled event type:", event.type);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

async function handlePaymentSuccess(event: any) {
  const data = event.data || {};
  const order = data.order || {};
  const customerDetails = data.customer_details || {};
  const payment = data.payment || {};
  const orderId = order.order_id || payment.order_id;
  const amount = Number(
    order.order_amount ?? payment.payment_amount ?? payment.amount ?? 0
  );
  const currency = order.order_currency || payment.payment_currency || "INR";
  const customerEmail = customerDetails.customer_email;
  const customerName = customerDetails.customer_name;
  const planName = order.order_note;
  const environment =
    process.env.CASHFREE_ENVIRONMENT === "production"
      ? "production"
      : "sandbox";

  console.log("[Payment Success] Processing payment:", {
    orderId,
    amount,
    customer: customerEmail,
  });

  // Early deduplication check - if payment already processed successfully, skip entirely
  const existingPayment = await getPaymentByOrderId(orderId);
  if (existingPayment && !Array.isArray(existingPayment)) {
    if (existingPayment.status === "PAYMENT_SUCCESS" || existingPayment.status === "PAID") {
      console.log(
        "[Payment Success] Duplicate webhook detected for order:",
        orderId,
        "- Already processed successfully. Skipping."
      );
      return;
    }
  }

  if (!customerEmail) {
    console.error(
      "[Payment Success] No customer email found in webhook payload for order:",
      orderId
    );
    // Still record the payment even without email
    await recordPaymentOnce({
      orderId,
      status: payment.payment_status || event.type || "PAYMENT_SUCCESS",
      amount,
      currency,
      customerEmail,
      customerName,
      environment,
      planName,
      raw: event,
    });
    return;
  }

  // Record the payment (idempotent - will update if already exists)
  const paymentRecord = await recordPaymentOnce({
    orderId,
    status: payment.payment_status || event.type || "PAYMENT_SUCCESS",
    amount,
    currency,
    customerEmail,
    customerName,
    environment,
    planName,
    raw: event,
  });

  if (!paymentRecord) {
    console.error("[Payment Success] Failed to record payment for order:", orderId);
    return;
  }

  console.log("[Payment Success] Payment recorded successfully for order:", orderId);

  // Activate subscription (only happens once due to early deduplication check)
  try {
    const user = await activateProSubscriptionByEmail(
      customerEmail,
      30,
      "cashfree"
    );
    if (!user) {
      console.error(
        "[Payment Success] Failed to activate subscription: User not found for email:",
        customerEmail,
        "order:",
        orderId
      );
    } else {
      console.log(
        "[Payment Success] Successfully activated Pro subscription for:",
        customerEmail,
        "order:",
        orderId
      );
    }
  } catch (error) {
    console.error("[Payment Success] Error activating subscription:", error, "order:", orderId);
  }
}

async function handlePaymentFailure(event: any) {
  const data = event.data || {};
  const order = data.order || {};
  const payment = data.payment || {};
  const orderId = order.order_id || payment.order_id;
  const amount = Number(
    order.order_amount ?? payment.payment_amount ?? payment.amount ?? 0
  );
  const currency = order.order_currency || payment.payment_currency || "INR";
  const customerEmail =
    order.customer_details?.customer_email ||
    payment.customer_details?.customer_email;
  const customerName =
    order.customer_details?.customer_name ||
    payment.customer_details?.customer_name;
  const planName = order.order_note;
  const environment =
    process.env.CASHFREE_ENVIRONMENT === "production"
      ? "production"
      : "sandbox";

  console.log("Payment failed:", { orderId, customer: customerEmail });

  await recordPaymentOnce({
    orderId,
    status: payment.payment_status || event.type || "PAYMENT_FAILED",
    amount,
    currency,
    customerEmail,
    customerName,
    environment,
    planName,
    raw: event,
  });
}

async function handlePaymentDropped(event: any) {
  const data = event.data || {};
  const order = data.order || {};
  const payment = data.payment || {};
  const orderId = order.order_id || payment.order_id;
  const amount = Number(
    order.order_amount ?? payment.payment_amount ?? payment.amount ?? 0
  );
  const currency = order.order_currency || payment.payment_currency || "INR";
  const customerEmail =
    order.customer_details?.customer_email ||
    payment.customer_details?.customer_email;
  const customerName =
    order.customer_details?.customer_name ||
    payment.customer_details?.customer_name;
  const planName = order.order_note;
  const environment =
    process.env.CASHFREE_ENVIRONMENT === "production"
      ? "production"
      : "sandbox";

  console.log("Payment dropped:", { orderId, customer: customerEmail });

  await recordPaymentOnce({
    orderId,
    status: payment.payment_status || event.type || "PAYMENT_USER_DROPPED",
    amount,
    currency,
    customerEmail,
    customerName,
    environment,
    planName,
    raw: event,
  });
}
