import { NextRequest, NextResponse } from "next/server";

import { ensureCashfreeClient } from "@/lib/cashfree";
import { appConfig } from "@/lib/config";

function jsonError(message: string, status = 400, details?: string | object) {
  return NextResponse.json(
    { error: message, ...(details ? { details } : {}) },
    { status }
  );
}

export async function POST(request: NextRequest) {
  try {
    const cf = ensureCashfreeClient();
    if ("error" in cf) return jsonError(cf.error, 500);

    const { amount, customerName, customerEmail, customerPhone, planName } =
      await request.json();

    // Validate required fields
    if (!amount || !customerName || !customerEmail || !customerPhone) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create unique order ID
    const orderId = `order_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 9)}`;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Normalize amount: client sends in paise by convention
    const normalizedAmountRupees = Number(amount) / 100;
    const currency = (
      process.env.CURRENCY ||
      appConfig.pricing.currency ||
      "INR"
    ).toUpperCase();

    const orderRequest = {
      order_amount: normalizedAmountRupees, // Cashfree SDK expects rupees
      order_currency: currency,
      order_id: orderId,
      customer_details: {
        customer_id: `customer_${Date.now()}`,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
      },
      order_meta: {
        return_url: `${appUrl}/payment/success?order_id={order_id}`,
        notify_url: `${appUrl}/api/payment/webhook`,
        // Allowed values: cc, dc, ppc, ccc, emi, paypal, upi, nb, app, paylater
        payment_methods: "cc,dc,upi,nb",
      },
      order_note: `Payment for ${planName || "Pro Plan"}`,
    } as const;

    // Create order using SDK v5 method (no API version argument)
    const response = await cf.client.PGCreateOrder(orderRequest);

    if (!response?.data) {
      console.error("Cashfree response:", response);
      throw new Error("Failed to create order");
    }

    return NextResponse.json({
      success: true,
      orderId: response.data.order_id,
      paymentSessionId: response.data.payment_session_id,
      orderAmount: response.data.order_amount,
      environment: cf.environment,
    });
  } catch (error: any) {
    const details =
      error?.response?.data?.message || error?.message || "Unknown error";
    console.error("Cashfree order creation error:", details);
    return jsonError("Failed to create payment order", 500, details);
  }
}
