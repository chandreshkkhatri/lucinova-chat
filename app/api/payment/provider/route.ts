import { NextResponse } from "next/server";

export async function GET() {
  // Default to 'razorpay' if PAYMENT_PROVIDER is not set
  const provider = process.env.PAYMENT_PROVIDER || "razorpay";
  return NextResponse.json({
    provider,
  });
}
