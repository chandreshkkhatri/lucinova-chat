"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitted(true);
        toast.success("Check your email for reset instructions");
      } else {
        console.error("Forgot password error:", data);
        toast.error(data.error || "Failed to send reset email");
      }
    } catch (error) {
      console.error("Forgot password exception:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen w-screen items-center justify-center pt-20 pb-8 bg-gradient-to-br from-secondary via-background to-secondary">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 size-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 size-96 bg-primary/5 rounded-full blur-3xl animate-pulse" />
      </div>

      <div className="relative w-full max-w-md mx-4 overflow-hidden rounded-2xl bg-card/80 backdrop-blur-xl border border-border shadow-2xl">
        <div className="p-6">
          <div className="flex flex-col items-center justify-center gap-4 text-center">
            {/* Logo and branding */}
            <div className="flex flex-col items-center gap-2">
              <div className="size-12 rounded-xl flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/lucidity-logo.svg"
                  alt="Lucidity"
                  width={48}
                  height={48}
                  className="size-full object-contain"
                  fetchPriority="high"
                  loading="eager"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">
                  Forgot Password
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {submitted
                    ? "Check your email"
                    : "Enter your email to reset your password"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6">
          {submitted ? (
            <div className="space-y-3">
              <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-xs text-green-800 dark:text-green-200">
                  If an account exists with <strong>{email}</strong>, you will
                  receive a password reset link shortly.
                </p>
              </div>
              <Link
                href="/login"
                className="block w-full text-center py-2.5 px-4 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors font-medium text-sm"
              >
                Back to Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full"
                />
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? "Sending..." : "Send Reset Link"}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                Remember your password?{" "}
                <Link
                  href="/login"
                  className="font-semibold text-primary hover:text-primary/80 transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
