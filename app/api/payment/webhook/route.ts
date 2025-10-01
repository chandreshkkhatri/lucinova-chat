import crypto from "crypto";

import { NextRequest, NextResponse } from "next/server";

import {
  activateProSubscriptionByEmail,
  recordPaymentOnce,
  getPaymentByOrderId,
} from "@/db/queries";

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-webhook-signature");
    const timestamp = request.headers.get("x-webhook-timestamp");

    if (!signature || !timestamp) {
      return NextResponse.json(
        { error: "Missing webhook signature or timestamp" },
        { status: 400 }
      );
    }

    // Verify webhook signature
    const webhookSecret = process.env.CASHFREE_WEBHOOK_SECRET!;
    const generatedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(timestamp + rawBody)
      .digest("base64");

    if (signature !== generatedSignature) {
      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 401 }
      );
    }

    const event = JSON.parse(rawBody);
    console.log("Webhook event received:", event.type);

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

  console.log("Payment successful:", {
    orderId,
    amount,
    customer: customerEmail,
  });

  if (!customerEmail) {
    console.error(
      "No customer email found in webhook payload for order:",
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

  // Check if this payment was already processed
  const existingPayment = await getPaymentByOrderId(orderId);
  const isAlreadyProcessed = existingPayment && !Array.isArray(existingPayment) && existingPayment.status === "PAYMENT_SUCCESS";

  // Idempotently record the payment
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
    console.error("Failed to record payment for order:", orderId);
    return;
  }

  // Skip subscription activation if already processed (duplicate webhook)
  if (isAlreadyProcessed) {
    console.log("Payment already processed, skipping subscription activation for order:", orderId);
    return;
  }

  // Activate subscription only if payment was successfully recorded and not already processed
  try {
    const user = await activateProSubscriptionByEmail(customerEmail, 30, "cashfree");
    if (!user) {
      console.error(
        "Failed to activate subscription: User not found for email:",
        customerEmail,
        "order:",
        orderId
      );
    } else {
      console.log("Successfully activated Pro subscription for:", customerEmail);
    }
  } catch (error) {
    console.error("Error activating subscription:", error, "order:", orderId);
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
