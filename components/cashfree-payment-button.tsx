"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PaymentModal } from "@/components/payment-modal";

interface CashfreePaymentButtonProps {
  amount: number;
  planName: string;
  className?: string;
  buttonText?: string;
}

interface UserSession {
  user?: {
    email?: string;
    name?: string;
  };
}

export function CashfreePaymentButton({
  amount,
  planName,
  className,
  buttonText = "Subscribe Now",
}: CashfreePaymentButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userSession, setUserSession] = useState<UserSession | null>(null);

  useEffect(() => {
    // Fetch user session data
    fetchUserSession();
  }, []);

  const fetchUserSession = async () => {
    try {
      const response = await fetch('/api/auth/session');
      if (response.ok) {
        const session = await response.json();
        setUserSession(session);
      }
    } catch (error) {
      console.log('No user session found');
    }
  };

  const handleSubscribe = () => {
    setIsModalOpen(true);
  };

  return (
    <>
      <Button
        onClick={handleSubscribe}
        className={className}
      >
        {buttonText}
      </Button>

      <PaymentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        amount={amount}
        planName={planName}
        userEmail={userSession?.user?.email}
        userName={userSession?.user?.name}
      />
    </>
  );
}