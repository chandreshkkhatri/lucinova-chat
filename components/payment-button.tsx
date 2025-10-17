"use client";

import { useEffect, useState } from "react";

import { CashfreePaymentButton } from "@/components/cashfree-payment-button";
import { RazorpayPaymentModal } from "@/components/razorpay-payment-modal";
import { Button } from "@/components/ui/button";

interface PaymentButtonProps {
  amount: number;
  planName: string;
  className?: string;
  buttonText?: string;
}

interface UserSession {
  user?: {
    email?: string;
    name?: string;
    phone?: string;
  };
}

/**
 * Unified payment button that renders either Cashfree or Razorpay
 * based on PAYMENT_PROVIDER environment variable
 */
export function PaymentButton({
  amount,
  planName,
  className,
  buttonText = "Subscribe Now",
}: PaymentButtonProps) {
  const [paymentProvider, setPaymentProvider] = useState<string | null>(null);
  const [isRazorpayModalOpen, setIsRazorpayModalOpen] = useState(false);
  const [userSession, setUserSession] = useState<UserSession | null>(null);
  const [profile, setProfile] = useState<{
    name?: string;
    phone?: string;
  } | null>(null);

  useEffect(() => {
    // Fetch payment provider from server
    fetchPaymentProvider();
    // Fetch user session data
    fetchUserSession();
  }, []);

  const fetchPaymentProvider = async () => {
    try {
      const response = await fetch("/api/payment/provider");
      if (response.ok) {
        const data = await response.json();
        setPaymentProvider(data.provider || "cashfree");
      } else {
        setPaymentProvider("cashfree"); // Default fallback
      }
    } catch (error) {
      console.error("Failed to fetch payment provider:", error);
      setPaymentProvider("cashfree"); // Default fallback
    }
  };

  const fetchUserSession = async () => {
    try {
      const response = await fetch("/api/auth/session");
      if (response.ok) {
        const session = await response.json();
        setUserSession(session);
        // If logged in, try to fetch profile for prefill
        if (session?.user?.email) {
          try {
            const profRes = await fetch("/api/user/profile");
            if (profRes.ok) {
              const data = await profRes.json();
              setProfile({ name: data.user?.name, phone: data.user?.phone });
            }
          } catch {}
        }
      }
    } catch (error) {
      console.log("No user session found");
    }
  };

  // Loading state
  if (paymentProvider === null) {
    return (
      <Button disabled className={className}>
        Loading...
      </Button>
    );
  }

  // Render Razorpay if provider is razorpay
  if (paymentProvider === "razorpay") {
    return (
      <>
        <Button onClick={() => setIsRazorpayModalOpen(true)} className={className}>
          {buttonText}
        </Button>

        <RazorpayPaymentModal
          isOpen={isRazorpayModalOpen}
          onClose={() => setIsRazorpayModalOpen(false)}
          amount={amount}
          planName={planName}
          userEmail={userSession?.user?.email}
          userName={profile?.name || userSession?.user?.name}
          userPhone={profile?.phone}
        />
      </>
    );
  }

  // Default: Render Cashfree
  return (
    <CashfreePaymentButton
      amount={amount}
      planName={planName}
      className={className}
      buttonText={buttonText}
    />
  );
}
