"use client";

import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { CountryCodeSelect } from "@/components/custom/country-code-select";
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
import { appConfig } from "@/lib/config";
import { DEFAULT_COUNTRY_CODE, getCountryByCode, validatePhone } from "@/lib/country-codes";

interface RazorpayPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  planName: string;
  userEmail?: string;
  userName?: string;
  userPhone?: string;
  userCountryCode?: string;
}

// Remove global Window interface declaration as it's in types/razorpay.d.ts

export function RazorpayPaymentModal({
  isOpen,
  onClose,
  amount,
  planName,
  userEmail = "",
  userName = "",
  userPhone = "",
  userCountryCode = "",
}: RazorpayPaymentModalProps) {
  const currency = appConfig.pricing.currency;
  const symbol = appConfig.getCurrencySymbol(currency);
  const [isLoading, setIsLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [countryCode, setCountryCode] = useState(userCountryCode || "");
  const [formData, setFormData] = useState({
    customerName: userName,
    customerEmail: userEmail,
    customerPhone: userPhone || "",
  });

  const handleCountryChange = useCallback((code: string) => {
    setCountryCode(code);
  }, []);

  useEffect(() => {
    // Load Razorpay checkout script
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => setScriptLoaded(true);
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    // Update form when user data changes
    setFormData((prev) => ({
      ...prev,
      customerName: userName || prev.customerName,
      customerEmail: userEmail || prev.customerEmail,
      customerPhone: (userPhone || prev.customerPhone || "").replace(/\D/g, ""),
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

      // Validate phone number based on selected country
      const phoneDigits = formData.customerPhone.replace(/\D/g, "");
      const selectedCountry = getCountryByCode(countryCode || DEFAULT_COUNTRY_CODE);
      if (!validatePhone(phoneDigits, countryCode || DEFAULT_COUNTRY_CODE)) {
        toast.error(`Please enter a valid phone number for ${selectedCountry?.name || "your country"}`);
        setIsLoading(false);
        return;
      }

      // Validate Razorpay script loaded
      if (!scriptLoaded || !window.Razorpay) {
        toast.error("Payment gateway not loaded. Please refresh and try again.");
        setIsLoading(false);
        return;
      }

      // Create subscription
      const response = await fetch("/api/payment/razorpay/create-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: formData.customerName,
          customerEmail: formData.customerEmail,
          customerPhone: formData.customerPhone,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("Subscription creation failed:", error);
        throw new Error(
          error.details || error.error || "Failed to create subscription"
        );
      }

      const data = await response.json();

      // Close modal before opening payment
      onClose();

      // Prepare Razorpay checkout options
      const dialCode = selectedCountry?.dialCode || "+1";
      const options = {
        key: data.razorpayKeyId,
        subscription_id: data.subscriptionId,
        name: "Lucidity",
        description: `${planName} Subscription`,
        image: "/images/lucidity-logo.svg", // Add your logo path
        prefill: {
          name: formData.customerName,
          email: formData.customerEmail,
          contact: `${dialCode}${phoneDigits}`,
        },
        theme: {
          color: "#3b82f6",
        },
        handler: function (response: any) {
          toast.success(
            "Subscription activated! Welcome to the Pro plan!"
          );

          // Redirect to success page
          setTimeout(() => {
            window.location.href = `/payment/success?subscription_id=${data.subscriptionId}&payment_id=${response.razorpay_payment_id}`;
          }, 2000);
        },
        modal: {
          ondismiss: function () {
            toast.info("Payment cancelled");
            setIsLoading(false);
          },
        },
      };

      // Open Razorpay checkout
      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (response: any) {
        console.error("Payment failed:", response.error);
        toast.error(
          `Payment failed: ${response.error.description || "Please try again"}`
        );
        setIsLoading(false);
      });

      rzp.open();
    } catch (error: any) {
      console.error("Payment initiation error:", error);
      toast.error(
        error.message || "Failed to initiate payment. Please try again."
      );
      setIsLoading(false);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow only numbers and limit length (15 digits max for international)
    const value = e.target.value.replace(/\D/g, "");
    if (value.length <= 15) {
      setFormData((prev) => ({ ...prev, customerPhone: value }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Subscribe to {planName}</DialogTitle>
          <DialogDescription>
            Monthly subscription for {symbol}
            {(amount / 100).toLocaleString()}
            /month
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
              <CountryCodeSelect
                value={countryCode}
                onChange={handleCountryChange}
                autoDetect={!countryCode}
                disabled={isLoading}
              />
              <Input
                id="phone"
                type="tel"
                inputMode="numeric"
                placeholder={getCountryByCode(countryCode || DEFAULT_COUNTRY_CODE)?.placeholder || "Phone number"}
                value={formData.customerPhone}
                onChange={handlePhoneChange}
                required
                disabled={isLoading}
                className="flex-1"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Enter your mobile number without country code
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
                {symbol}
                {(amount / 100).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-sm mt-2">
              <span>Billing</span>
              <span className="font-medium">Monthly (Auto-renew)</span>
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
            <Button type="submit" disabled={isLoading || !scriptLoaded} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Subscribe Now"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
