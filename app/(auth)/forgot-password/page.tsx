"use client";

import Image from "next/image";
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
        toast.error(data.error || "Failed to send reset email");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 size-96 bg-blue-200/20 dark:bg-blue-800/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 size-96 bg-purple-200/20 dark:bg-purple-800/10 rounded-full blur-3xl animate-pulse" />
      </div>

      <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-white/20 dark:border-gray-800/50 shadow-2xl">
        <div className="p-8">
          <div className="flex flex-col items-center justify-center gap-6 text-center">
            {/* Logo and branding */}
            <div className="flex flex-col items-center gap-3">
              <div className="size-16 bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center shadow-lg border border-gray-200 dark:border-gray-700 p-3">
                <Image
                  src="/images/delibration-logo.png"
                  alt="Delibration"
                  width={48}
                  height={48}
                  className="size-full object-contain"
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Forgot Password
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {submitted
                    ? "Check your email"
                    : "Enter your email to reset your password"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-8 pb-8">
          {submitted ? (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-sm text-green-800 dark:text-green-200">
                  If an account exists with <strong>{email}</strong>, you will
                  receive a password reset link shortly.
                </p>
              </div>
              <Link
                href="/login"
                className="block w-full text-center py-3 px-4 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors font-medium"
              >
                Back to Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
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

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full"
              >
                {isSubmitting ? "Sending..." : "Send Reset Link"}
              </Button>

              <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                Remember your password?{" "}
                <Link
                  href="/login"
                  className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
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