"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useActionState, useEffect, useState, Suspense } from "react";
import { toast } from "sonner";
import { signIn } from "next-auth/react";

import { AuthForm } from "@/components/custom/auth-form";
import { SubmitButton } from "@/components/custom/submit-button";
import { Button } from "@/components/ui/button";
import { trackSignUpConversion } from "@/lib/gtag";

import { register, RegisterActionState } from "../actions";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const referralCode = searchParams.get("ref") || "";

  const [email, setEmail] = useState("");
  const [state, formAction] = useActionState<RegisterActionState, FormData>(
    register,
    {
      status: "idle",
    }
  );

  useEffect(() => {
    if (state.status === "user_exists") {
      toast.error("Account already exists");
    } else if (state.status === "failed") {
      toast.error("Failed to create account");
    } else if (state.status === "invalid_data") {
      toast.error("Failed validating your submission!");
    } else if (state.status === "terms_not_accepted") {
      toast.error("You must accept the Terms & Conditions to register");
    } else if (state.status === "success") {
      toast.success("Account created successfully");
      // Await tracking beacon before navigating to avoid losing the event
      trackSignUpConversion("email").then(() => {
        router.refresh();
      });
    }
  }, [state, router]);

  const handleSubmit = (formData: FormData) => {
    setEmail(formData.get("email") as string);
    // Inject referral code from URL into the form data
    if (referralCode) {
      formData.set("referralCode", referralCode);
    }
    formAction(formData);
  };

  const handleGoogleSignIn = async () => {
    try {
      // Set referral code cookie so the OAuth callback can read it
      if (referralCode) {
        document.cookie = `referral_code=${encodeURIComponent(referralCode)};path=/;max-age=600;SameSite=Lax`;
      }
      const result = await signIn("google", {
        callbackUrl: "/",
        redirect: true,
      });

      // If signIn returns an error, it means OAuth is not configured
      if (result?.error) {
        toast.error("Google OAuth is not configured. Please check your GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.");
      }
    } catch (error) {
      console.error("Google sign-in error:", error);
      toast.error("Failed to sign in with Google. Please check your OAuth configuration.");
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
        {referralCode && (
          <div className="bg-primary/10 border-b border-primary/20 px-6 py-3 text-center">
            <p className="text-sm text-primary font-medium">
              You were referred by a friend! You&apos;ll get 50% off your first Pro month.
            </p>
          </div>
        )}
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
                  Join Lucidity
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Think in threads, learn in layers
                </p>
              </div>
            </div>

            <div className="w-full">
              <h3 className="text-base font-semibold text-foreground mb-1">
                Create Account
              </h3>
              <p className="text-xs text-muted-foreground">
                Create an account with your email and password
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 pb-7">
          <AuthForm action={handleSubmit} defaultEmail={email} showTermsCheckbox>
            <SubmitButton>Sign Up</SubmitButton>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-card px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleSignIn}
              className="w-full"
            >
              <svg className="mr-2 size-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Sign up with Google
            </Button>

            <p className="text-center text-xs text-muted-foreground mt-4">
              {"Already have an account? "}
              <Link
                href="/login"
                className="font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                Sign in
              </Link>
              {" instead."}
            </p>
          </AuthForm>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
}
