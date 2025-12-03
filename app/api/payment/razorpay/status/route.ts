import { NextRequest, NextResponse } from "next/server";

import { fetchRazorpayPayment, fetchRazorpaySubscription } from "@/lib/razorpay";

function jsonError(message: string, status = 400, details?: string | object) {
  return NextResponse.json(
    { error: message, ...(details ? { details } : {}) },
    { status }
  );
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get("payment_id");
    const subscriptionId = searchParams.get("subscription_id");

    if (!paymentId && !subscriptionId) {
      return jsonError("payment_id or subscription_id is required", 422);
    }

    if (paymentId) {
      try {
        const payment = await fetchRazorpayPayment(paymentId);

        // Convert amount from paise to rupees for display
        const amountInRupees = payment.amount / 100;

        const response = {
          success: true,
          paymentId: payment.id,
          orderId: payment.id,
          orderAmount: amountInRupees,
          amount: payment.amount,
          currency: payment.currency,
          status: payment.status,
          orderStatus: payment.status,
          email: payment.email || payment.notes?.customer_email,
        };

        return NextResponse.json(response);
      } catch (err: any) {
        console.error("Error fetching payment:", err);
        return jsonError("Failed to fetch payment", 500, err.message);
      }
    }

    if (subscriptionId) {
      try {
        const subscription = await fetchRazorpaySubscription(subscriptionId);

        const response = {
          success: true,
          subscriptionId: subscription.id,
          orderId: subscription.id,
          status: subscription.status,
          orderStatus: subscription.status,
          planId: subscription.plan_id,
          customerId: subscription.customer_id,
          notes: subscription.notes,
          orderAmount: 0,
        };

        return NextResponse.json(response);
      } catch (err: any) {
        console.error("Error fetching subscription:", err);
        return jsonError("Failed to fetch subscription", 500, err.message);
      }
    }

    return jsonError("Unknown error", 500);
  } catch (error: any) {
    console.error("Razorpay status error:", error);
    return jsonError("Failed to get status", 500, error.message);
  }
}
