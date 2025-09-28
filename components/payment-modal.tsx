"use client";

import { load, type CashfreeCheckoutOptions } from "@cashfreepayments/cashfree-js";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  planName: string;
  userEmail?: string;
  userName?: string;
  userPhone?: string;
}

export function PaymentModal({
  isOpen,
  onClose,
  amount,
  planName,
  userEmail = "",
  userName = "",
  userPhone = "",
}: PaymentModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    customerName: userName,
    customerEmail: userEmail,
    customerPhone: userPhone || "",
  });

  useEffect(() => {
    // Update form when user data changes
    setFormData((prev) => ({
      ...prev,
      customerName: userName || prev.customerName,
      customerEmail: userEmail || prev.customerEmail,
      customerPhone: (userPhone || prev.customerPhone || "").replace(/\D/g, "")
    }));
  }, [userName, userEmail, userPhone]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate form
      if (
        !formData.customerName ||
        !formData.customerEmail ||
        !formData.customerPhone
      ) {
        toast.error("Please fill in all required fields");
        setIsLoading(false);
        return;
      }

      // Validate phone number (basic validation for Indian numbers)
      const phoneRegex = /^[6-9]\d{9}$/;
      if (!phoneRegex.test(formData.customerPhone.replace(/\D/g, ""))) {
        toast.error("Please enter a valid 10-digit Indian mobile number");
        setIsLoading(false);
        return;
      }

      // Create order
      const orderResponse = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          planName,
          customerName: formData.customerName,
          customerEmail: formData.customerEmail,
          customerPhone: formData.customerPhone,
        }),
      });

      if (!orderResponse.ok) {
        const error = await orderResponse.json();
        console.error("Order creation failed:", error);
        throw new Error(
          error.details || error.error || "Failed to create payment order"
        );
      }

      const orderData = await orderResponse.json();

      // Initialize Cashfree SDK
      const cashfree = await load({
        mode: orderData.environment === "production" ? "production" : "sandbox",
      });

      // Close modal before opening payment
      onClose();

      // Prepare checkout options
      const checkoutOptions: CashfreeCheckoutOptions = {
        paymentSessionId: String(orderData.paymentSessionId),
        redirectTarget: "_modal",
        appearance: {
          theme: "light",
          primaryColor: "#3b82f6",
        },
      };

      // Open Cashfree checkout
      cashfree
        .checkout(checkoutOptions)
        .then((result: any) => {
          if (result.error) {
            console.error("Payment failed:", result.error);
            toast.error("Payment failed. Please try again.");
          } else if (result.paymentDetails) {
            console.log("Payment successful:", result.paymentDetails);
            toast.success("Payment successful! Welcome to Pro plan!");

            // Redirect to success page
            setTimeout(() => {
              window.location.href = `/payment/success?order_id=${orderData.orderId}`;
            }, 2000);
          }
        })
        .catch((error: any) => {
          console.error("Checkout error:", error);
          toast.error("Payment process interrupted");
        });
    } catch (error: any) {
      console.error("Payment initiation error:", error);
      toast.error(
        error.message || "Failed to initiate payment. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow only numbers and format
    const value = e.target.value.replace(/\D/g, "");
    if (value.length <= 10) {
      setFormData((prev) => ({ ...prev, customerPhone: value }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Complete Your Purchase</DialogTitle>
          <DialogDescription>
            Subscribe to {planName} for ₹
            {(amount / 100).toLocaleString("en-IN")}/month
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="Enter your full name"
              value={formData.customerName}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  customerName: e.target.value,
                }))
              }
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={formData.customerEmail}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  customerEmail: e.target.value,
                }))
              }
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Mobile Number</Label>
            <div className="flex gap-2">
              <Input className="w-20" value="+91" disabled />
              <Input
                id="phone"
                type="tel"
                placeholder="9876543210"
                value={formData.customerPhone}
                onChange={handlePhoneChange}
                required
                disabled={isLoading}
                className="flex-1"
              />
            </div>
            <p className="text-xs text-gray-500">
              Enter 10-digit Indian mobile number
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <div className="flex justify-between text-sm">
              <span>Plan</span>
              <span className="font-medium">{planName}</span>
            </div>
            <div className="flex justify-between text-sm mt-2">
              <span>Amount</span>
              <span className="font-medium">
                ₹{(amount / 100).toLocaleString("en-IN")}
              </span>
            </div>
            <div className="flex justify-between text-sm mt-2">
              <span>Billing</span>
              <span className="font-medium">Monthly</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="w-full"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Proceed to Payment"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
