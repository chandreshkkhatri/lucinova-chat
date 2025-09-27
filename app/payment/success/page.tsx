"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      const response = await fetch(`/api/payment/status?order_id=${orderId}`);
      const data = await response.json();
      setOrderDetails(data);
    } catch (error) {
      console.error("Failed to fetch order details:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          {isLoading ? (
            <>
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-gray-400" />
              <CardTitle className="mt-4">Processing Payment...</CardTitle>
              <CardDescription>Please wait while we confirm your payment</CardDescription>
            </>
          ) : (
            <>
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
              <CardTitle className="mt-4 text-2xl">Payment Successful!</CardTitle>
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
                <span className="text-sm text-gray-600 dark:text-gray-400">Order ID</span>
                <span className="text-sm font-medium">{orderDetails.orderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Amount Paid</span>
                <span className="text-sm font-medium">₹{orderDetails.orderAmount / 100}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Status</span>
                <span className="text-sm font-medium text-green-600">{orderDetails.orderStatus}</span>
              </div>
            </div>
          )}

          <div className="space-y-2 pt-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
              You now have access to all Pro features. A confirmation email has been sent to your registered email address.
            </p>

            <div className="flex gap-2">
              <Button asChild className="w-full">
                <Link href="/">Start Using Pro Features</Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/account">View Account</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}