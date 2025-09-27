import { NextRequest, NextResponse } from 'next/server';

// Initialize Cashfree
const initializeCashfree = () => {
  const { Cashfree, CFEnvironment } = require('cashfree-pg');
  const cashfree = new Cashfree({
    environment: process.env.CASHFREE_ENVIRONMENT === 'production'
      ? CFEnvironment.PRODUCTION
      : CFEnvironment.SANDBOX,
    clientId: process.env.CASHFREE_APP_ID!,
    clientSecret: process.env.CASHFREE_SECRET_KEY!,
  });
  return cashfree;
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('order_id');

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Initialize Cashfree
    const cashfree = initializeCashfree();

    // Fetch order status from Cashfree
    const response = await cashfree.PGFetchOrder("2022-09-01", orderId);

    if (!response?.data) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    const order = response.data;

    return NextResponse.json({
      success: true,
      orderId: order.order_id,
      orderStatus: order.order_status,
      orderAmount: order.order_amount,
      paymentStatus: order.payment_status,
      customerDetails: order.customer_details,
      createdAt: order.created_at
    });

  } catch (error: any) {
    console.error('Order status check error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch order status',
        details: error?.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}