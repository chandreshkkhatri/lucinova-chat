import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-webhook-signature');
    const timestamp = request.headers.get('x-webhook-timestamp');

    if (!signature || !timestamp) {
      return NextResponse.json(
        { error: 'Missing webhook signature or timestamp' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    const webhookSecret = process.env.CASHFREE_WEBHOOK_SECRET!;
    const generatedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(timestamp + rawBody)
      .digest('base64');

    if (signature !== generatedSignature) {
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 401 }
      );
    }

    const event = JSON.parse(rawBody);
    console.log('Webhook event received:', event.type);

    // Handle different event types
    switch (event.type) {
      case 'PAYMENT_SUCCESS':
        await handlePaymentSuccess(event.data);
        break;
      case 'PAYMENT_FAILED':
        await handlePaymentFailure(event.data);
        break;
      case 'PAYMENT_USER_DROPPED':
        await handlePaymentDropped(event.data);
        break;
      default:
        console.log('Unhandled event type:', event.type);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handlePaymentSuccess(data: any) {
  const { order_id, payment_amount, customer_details } = data.order;

  console.log('Payment successful:', {
    orderId: order_id,
    amount: payment_amount,
    customer: customer_details.customer_email
  });

  // TODO: Add your business logic here
  // - Update user subscription in database
  // - Send confirmation email
  // - Grant access to premium features
}

async function handlePaymentFailure(data: any) {
  const { order_id, customer_details } = data.order;

  console.log('Payment failed:', {
    orderId: order_id,
    customer: customer_details.customer_email
  });

  // TODO: Add your business logic here
  // - Log failed payment attempt
  // - Send failure notification email
}

async function handlePaymentDropped(data: any) {
  const { order_id, customer_details } = data.order;

  console.log('Payment dropped:', {
    orderId: order_id,
    customer: customer_details.customer_email
  });

  // TODO: Add your business logic here
  // - Log dropped payment
  // - Send abandoned cart email
}