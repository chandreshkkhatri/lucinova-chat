import { Cashfree, CFEnvironment } from "cashfree-pg";
import { NextRequest, NextResponse } from "next/server";

// Small helper to keep error responses consistent
function jsonError(message: string, status = 400, details?: string | object) {
  return NextResponse.json(
    { error: message, ...(details ? { details } : {}) },
    { status }
  );
}

// Factory to create the Cashfree client (validates env)
function getCashfreeClient() {
  const appId = process.env.CASHFREE_APP_ID;
  const secret = process.env.CASHFREE_SECRET_KEY;
  const isProd = process.env.CASHFREE_ENVIRONMENT === "production";

  if (!appId || !secret)
    return { error: "Server payment configuration missing." as const };

  const client = new Cashfree(
    isProd ? CFEnvironment.PRODUCTION : CFEnvironment.SANDBOX,
    appId,
    secret
  );
  return { client } as const;
}

export async function GET(request: NextRequest) {
  try {
    const cf = getCashfreeClient();
    if ("error" in cf) return jsonError(cf.error as string, 500);

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("order_id");

    if (!orderId) {
      return jsonError("Order ID is required", 422);
    }

    // Fetch order status from Cashfree (v5: no version arg)
    const response = await cf.client.PGFetchOrder(orderId);

    if (!response?.data) {
      return jsonError("Order not found", 404);
    }

    const order = response.data;

    return NextResponse.json({
      success: true,
      orderId: order.order_id,
      orderStatus: order.order_status,
      orderAmount: order.order_amount,
      customerDetails: order.customer_details,
      createdAt: order.created_at,
    });
  } catch (error: any) {
    const details =
      error?.response?.data?.message || error?.message || "Unknown error";
    console.error("Order status check error:", details);
    return jsonError("Failed to fetch order status", 500, details);
  }
}
