"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";

import { AuthForm } from "@/components/custom/auth-form";
import { SubmitButton } from "@/components/custom/submit-button";

import { register, RegisterActionState } from "../actions";

export default function Page() {
  const router = useRouter();

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
    } else if (state.status === "success") {
      toast.success("Account created successfully");
      router.refresh();
    }
  }, [state, router]);

  const handleSubmit = (formData: FormData) => {
    setEmail(formData.get("email") as string);
    formAction(formData);
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
                  src="/images/karmalok-logo.png"
                  alt="Karmalok"
                  width={48}
                  height={48}
                  className="size-full object-contain"
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Join Karmalok
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Think in threads, learn in layers
                </p>
              </div>
            </div>

            <div className="w-full">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                Create Account
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Create an account with your email and password
              </p>
            </div>
          </div>
        </div>

        <div className="px-8 pb-8">
          <AuthForm action={handleSubmit} defaultEmail={email}>
            <SubmitButton>Sign Up</SubmitButton>
            <p className="text-center text-sm text-gray-600 mt-4 dark:text-gray-400">
              {"Already have an account? "}
              <Link
                href="/login"
                className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
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
