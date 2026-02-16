"use client";

import { useEffect, useState } from "react";

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
 * Payment button for Razorpay subscription-based purchases
 */
export function PaymentButton({
  amount,
  planName,
  className,
  buttonText = "Subscribe Now",
}: PaymentButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userSession, setUserSession] = useState<UserSession | null>(null);
  const [profile, setProfile] = useState<{
    name?: string;
    phone?: string;
    countryCode?: string;
  } | null>(null);

  useEffect(() => {
    // Fetch user session data
    fetchUserSession();
  }, []);

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
              setProfile({
                name: data.user?.name,
                phone: data.user?.phone,
                countryCode: data.user?.countryCode,
              });
            }
          } catch {}
        }
      }
    } catch {
      // No user session
    }
  };

  return (
    <>
      <Button onClick={() => setIsModalOpen(true)} className={className}>
        {buttonText}
      </Button>

      <RazorpayPaymentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        amount={amount}
        planName={planName}
        userEmail={userSession?.user?.email}
        userName={profile?.name || userSession?.user?.name}
        userPhone={profile?.phone}
        userCountryCode={profile?.countryCode}
      />
    </>
  );
}
