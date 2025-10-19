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
        console.log("[Payment Status API] Fetched payment:", {
          id: payment.id,
          amount: payment.amount,
          currency: payment.currency,
          status: payment.status,
          email: payment.email || payment.notes?.customer_email,
        });

        // Convert amount from paise to rupees for display
        const amountInRupees = payment.amount / 100;

        const response = {
          success: true,
          paymentId: payment.id,
          orderId: payment.id, // Add orderId for compatibility
          orderAmount: amountInRupees, // Add orderAmount for success page
          amount: payment.amount, // Keep raw amount
          currency: payment.currency,
          status: payment.status,
          orderStatus: payment.status, // Add orderStatus for compatibility
          email: payment.email || payment.notes?.customer_email,
        };

        console.log("[Payment Status API] Returning response:", response);
        return NextResponse.json(response);
      } catch (err: any) {
        console.error("[Payment Status API] Error fetching payment:", err);
        return jsonError("Failed to fetch payment", 500, err.message);
      }
    }

    if (subscriptionId) {
      try {
        const subscription = await fetchRazorpaySubscription(subscriptionId);
        console.log("[Payment Status API] Fetched subscription:", {
          id: subscription.id,
          status: subscription.status,
          plan_id: subscription.plan_id,
          customer_id: subscription.customer_id,
          notes: subscription.notes,
        });

        const response = {
          success: true,
          subscriptionId: subscription.id,
          orderId: subscription.id, // Add orderId for compatibility
          status: subscription.status,
          orderStatus: subscription.status, // Add orderStatus for compatibility
          planId: subscription.plan_id,
          customerId: subscription.customer_id,
          notes: subscription.notes,
          // Note: For subscriptions, amount info might be in the plan details
          orderAmount: 0, // Placeholder - subscription amount needs to be fetched from plan
        };

        console.log("[Payment Status API] Returning subscription response:", response);
        return NextResponse.json(response);
      } catch (err: any) {
        console.error("[Payment Status API] Error fetching subscription:", err);
        return jsonError("Failed to fetch subscription", 500, err.message);
      }
    }

    return jsonError("Unknown error", 500);
  } catch (error: any) {
    console.error("Razorpay status error:", error);
    return jsonError("Failed to get status", 500, error.message);
  }
}
