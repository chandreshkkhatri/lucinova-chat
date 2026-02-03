"use client";

import { CheckCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { trackPurchaseConversion } from "@/lib/gtag";

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");
  const paymentId = searchParams.get("payment_id");
  const subscriptionId = searchParams.get("subscription_id");
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const conversionTracked = useRef(false);

  useEffect(() => {
    // Prefer Razorpay identifiers first
    const run = async () => {
      try {
        if (paymentId || subscriptionId) {
          const q = paymentId
            ? `payment_id=${encodeURIComponent(paymentId)}`
            : `subscription_id=${encodeURIComponent(subscriptionId!)}`;

          const response = await fetch(`/api/payment/razorpay/status?${q}`);
          const data = await response.json();
          setOrderDetails(data);

          // Track purchase conversion (only once)
          if (!conversionTracked.current && data?.orderAmount) {
            trackPurchaseConversion(
              Number(data.orderAmount),
              "INR",
              data.orderId
            );
            conversionTracked.current = true;
          }
          return;
        }

        if (orderId) {
          const response = await fetch(`/api/payment/status?order_id=${orderId}`);
          const data = await response.json();
          setOrderDetails(data);

          // Track purchase conversion (only once)
          if (!conversionTracked.current && data?.orderAmount) {
            trackPurchaseConversion(
              Number(data.orderAmount),
              "INR",
              data.orderId
            );
            conversionTracked.current = true;
          }
        }
      } catch (error) {
        console.error("Failed to fetch order details:", error);
      } finally {
        setIsLoading(false);
      }
    };

    // If no identifiers at all, stop loading immediately
    if (!orderId && !paymentId && !subscriptionId) {
      setIsLoading(false);
      return;
    }

    run();
  }, [orderId, paymentId, subscriptionId]);

  return (
    <Card className="max-w-md w-full">
      <CardHeader className="text-center">
        {isLoading ? (
          <>
            <Loader2 className="size-12 animate-spin mx-auto text-gray-400" />
            <CardTitle className="mt-4">Processing Payment...</CardTitle>
            <CardDescription>
              Please wait while we confirm your payment
            </CardDescription>
          </>
        ) : (
          <>
            <CheckCircle className="size-12 text-green-500 mx-auto" />
            <CardTitle className="mt-4 text-2xl">
              Payment Successful!
            </CardTitle>
            <CardDescription>
              Thank you for subscribing to the Pro Plan
            </CardDescription>
          </>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {!isLoading && orderDetails && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Order ID
              </span>
              <span className="text-sm font-medium">
                {orderDetails.orderId}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Amount Paid
              </span>
              <span className="text-sm font-medium">
                ₹{Number(orderDetails.orderAmount).toLocaleString("en-IN")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Status
              </span>
              <span className="text-sm font-medium text-green-600">
                {orderDetails.orderStatus}
              </span>
            </div>
          </div>
        )}

        <div className="space-y-2 pt-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
            You now have access to all Pro features. A confirmation email has
            been sent to your registered email address.
          </p>

          <div className="flex gap-2">
            <Button asChild className="w-full">
              <Link href="/beta">Start Using Pro Features</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/beta/account">View Account</Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function LoadingFallback() {
  return (
    <Card className="max-w-md w-full">
      <CardHeader className="text-center">
        <Loader2 className="size-12 animate-spin mx-auto text-gray-400" />
        <CardTitle className="mt-4">Loading...</CardTitle>
        <CardDescription>Please wait...</CardDescription>
      </CardHeader>
    </Card>
  );
}

export default function PaymentSuccessPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <Suspense fallback={<LoadingFallback />}>
        <PaymentSuccessContent />
      </Suspense>
    </main>
  );
}
