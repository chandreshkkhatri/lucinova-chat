import { Cashfree, CFEnvironment } from "cashfree-pg";
import { NextRequest, NextResponse } from "next/server";

const CF_APP_ID = process.env.CASHFREE_APP_ID;
const CF_SECRET = process.env.CASHFREE_SECRET_KEY;
const IS_PROD = process.env.CASHFREE_ENVIRONMENT === "production";

// Create Cashfree instance (SDK v5)
const cashfree = new Cashfree(
  IS_PROD ? CFEnvironment.PRODUCTION : CFEnvironment.SANDBOX,
  CF_APP_ID || "",
  CF_SECRET || ""
);

export async function GET(request: NextRequest) {
  try {
    if (!CF_APP_ID || !CF_SECRET) {
      return NextResponse.json(
        { error: "Server payment configuration missing." },
        { status: 500 }
      );
    }
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("order_id");

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    // Fetch order status from Cashfree (v5: no version arg)
    const response = await cashfree.PGFetchOrder(orderId);

    if (!response?.data) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
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
    console.error("Order status check error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch order status",
        details: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
