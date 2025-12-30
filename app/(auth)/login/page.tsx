"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useActionState, useEffect, useState, Suspense } from "react";
import { toast } from "sonner";

import { AuthForm } from "@/components/custom/auth-form";
import { SubmitButton } from "@/components/custom/submit-button";
import { Button } from "@/components/ui/button";

import { login, LoginActionState } from "../actions";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");

  const [state, formAction] = useActionState<LoginActionState, FormData>(
    login,
    {
      status: "idle",
    }
  );

  // Check for OAuth errors in URL params
  useEffect(() => {
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");
    const callbackUrl = searchParams.get("callbackUrl");
    
    if (error || (callbackUrl && callbackUrl.includes("/api/auth/error"))) {
      // Clear the error from URL
      router.replace("/login", { scroll: false });
      
      // Show appropriate error message
      if (error === "Configuration") {
        toast.error("Google OAuth is not configured. Please check your GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.");
      } else if (error === "AccessDenied") {
        toast.error("Access denied. You may have cancelled the sign-in or access was denied.");
      } else if (error === "OAuthAccountNotLinked") {
        toast.error("An account with this email already exists. Please sign in with your password.");
      } else if (error === "OAuthCallback") {
        toast.error("OAuth callback error. Please check your redirect URI in Google Console matches: http://localhost:3000/api/auth/callback/google");
      } else if (error === "OAuthSignin") {
        const message = errorDescription || "OAuth sign-in error. Please verify your Google OAuth credentials are correct.";
        toast.error(message);
      } else if (error === "OAuthCreateAccount") {
        toast.error("Failed to create account. Please try again.");
      } else if (callbackUrl && callbackUrl.includes("/api/auth/error")) {
        // Error page was hit but no error param - likely a database or server error
        toast.error("Failed to sign in with Google. Please check your server logs for details. This might be a database connection issue.");
      } else {
        const message = errorDescription || `Failed to sign in with Google. Error: ${error || "Unknown error"}`;
        toast.error(message);
      }
    }
  }, [searchParams, router]);

  useEffect(() => {
    if (!state) return;

    if (state.status === "failed") {
      toast.error("Invalid credentials!");
    } else if (state.status === "invalid_data") {
      toast.error("Failed validating your submission!");
    } else if (state.status === "success") {
      router.refresh();
    }
  }, [state, router]);

  const handleSubmit = (formData: FormData) => {
    setEmail(formData.get("email") as string);
    formAction(formData);
  };

  const handleGoogleSignIn = async () => {
    try {
      await signIn("google", { 
        callbackUrl: "/",
        redirect: true,
      });
    } catch (error) {
      toast.error("Failed to sign in with Google. Please try again.");
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
                  Welcome to Lucidity
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Think in threads, learn in layers
                </p>
              </div>
            </div>

            <div className="w-full">
              <h3 className="text-base font-semibold text-foreground mb-1">
                Sign In
              </h3>
              <p className="text-xs text-muted-foreground">
                Use your email and password to continue
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 pb-7">
          <AuthForm action={handleSubmit} defaultEmail={email}>
            <SubmitButton>Sign in</SubmitButton>

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
              Sign in with Google
            </Button>

            <div className="text-center text-xs text-muted-foreground mt-4 space-y-1.5">
              <p>
                <Link
                  href="/forgot-password"
                  className="font-semibold text-primary hover:text-primary/80 transition-colors"
                >
                  Forgot password?
                </Link>
              </p>
              <p>
                {"Don't have an account? "}
                <Link
                  href="/register"
                  className="font-semibold text-primary hover:text-primary/80 transition-colors"
                >
                  Sign up
                </Link>
                {" for free."}
              </p>
            </div>
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
      <LoginForm />
    </Suspense>
  );
}
