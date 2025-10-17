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
        return NextResponse.json({
          success: true,
          paymentId: payment.id,
          amount: payment.amount,
          currency: payment.currency,
          status: payment.status,
          email: payment.email || payment.notes?.customer_email,
        });
      } catch (err: any) {
        return jsonError("Failed to fetch payment", 500, err.message);
      }
    }

    if (subscriptionId) {
      try {
        const subscription = await fetchRazorpaySubscription(subscriptionId);
        return NextResponse.json({
          success: true,
          subscriptionId: subscription.id,
          status: subscription.status,
          planId: subscription.plan_id,
          customerId: subscription.customer_id,
          notes: subscription.notes,
        });
      } catch (err: any) {
        return jsonError("Failed to fetch subscription", 500, err.message);
      }
    }

    return jsonError("Unknown error", 500);
  } catch (error: any) {
    console.error("Razorpay status error:", error);
    return jsonError("Failed to get status", 500, error.message);
  }
}
