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

export async function POST(request: NextRequest) {
  try {
    const { amount, customerName, customerEmail, customerPhone, planName } = await request.json();

    // Validate required fields
    if (!amount || !customerName || !customerEmail || !customerPhone) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create unique order ID
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Check if using demo/test credentials (for development purposes)
    const isDemo = process.env.CASHFREE_APP_ID?.startsWith('TEST') &&
                   process.env.CASHFREE_SECRET_KEY?.startsWith('TEST');

    if (isDemo) {
      // Return a mock successful response for demo purposes
      console.log('Demo mode: Creating mock order for testing');
      return NextResponse.json({
        success: true,
        orderId: orderId,
        paymentSessionId: `session_${Date.now()}`,
        orderAmount: amount,
        environment: process.env.CASHFREE_ENVIRONMENT,
        isDemo: true
      });
    }

    // Production mode: Use actual Cashfree API
    const cashfree = initializeCashfree();

    const orderRequest = {
      order_amount: amount,
      order_currency: "INR",
      order_id: orderId,
      customer_details: {
        customer_id: `customer_${Date.now()}`,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
      },
      order_meta: {
        return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/payment/success?order_id=${orderId}`,
        notify_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/payment/webhook`,
        payment_methods: "cc,dc,upi,nb,wallet"
      },
      order_note: `Payment for ${planName || 'Pro Plan'}`,
    };

    // Create order
    const response = await cashfree.PGCreateOrder("2022-09-01", orderRequest);

    if (!response?.data) {
      console.error('Cashfree response:', response);
      throw new Error('Failed to create order');
    }

    return NextResponse.json({
      success: true,
      orderId: response.data.order_id,
      paymentSessionId: response.data.payment_session_id,
      orderAmount: response.data.order_amount,
      environment: process.env.CASHFREE_ENVIRONMENT
    });

  } catch (error: any) {
    console.error('Cashfree order creation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to create payment order',
        details: error?.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}