import { Cashfree, CFEnvironment } from "cashfree-pg";
import { NextRequest, NextResponse } from "next/server";

// Guard against missing credentials early
const CF_APP_ID = process.env.CASHFREE_APP_ID;
const CF_SECRET = process.env.CASHFREE_SECRET_KEY;
const IS_PROD = process.env.CASHFREE_ENVIRONMENT === "production";

// Create Cashfree instance (SDK v5 style)
const cashfree = new Cashfree(
  IS_PROD ? CFEnvironment.PRODUCTION : CFEnvironment.SANDBOX,
  CF_APP_ID || "",
  CF_SECRET || ""
);

export async function POST(request: NextRequest) {
  try {
    if (!CF_APP_ID || !CF_SECRET) {
      console.error(
        "Cashfree credentials missing. Check CASHFREE_APP_ID and CASHFREE_SECRET_KEY env vars."
      );
      return NextResponse.json(
        {
          error:
            "Server payment configuration missing. Please try again later.",
        },
        { status: 500 }
      );
    }

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

    const orderRequest = {
      order_amount: amount / 100, // our UI sends paise; SDK expects rupees
      order_currency: "INR",
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
    const response = await cashfree.PGCreateOrder(orderRequest);

    if (!response?.data) {
      console.error("Cashfree response:", response);
      throw new Error("Failed to create order");
    }

    return NextResponse.json({
      success: true,
      orderId: response.data.order_id,
      paymentSessionId: response.data.payment_session_id,
      orderAmount: response.data.order_amount,
      environment: IS_PROD ? "production" : "sandbox",
    });
  } catch (error: any) {
    console.error("Cashfree order creation error:", error);
    return NextResponse.json(
      {
        error: "Failed to create payment order",
        details:
          error?.response?.data?.message || error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
