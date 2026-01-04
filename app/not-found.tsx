"use client";

import Link from "next/link";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-gradient-to-br from-background via-muted/40 to-background">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 size-96 rounded-full bg-primary/10 blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 size-96 rounded-full bg-accent/15 blur-3xl animate-pulse" />
      </div>

      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-border/60 bg-card/80 shadow-2xl backdrop-blur-xl">
        <div className="p-8">
          <div className="flex flex-col items-center justify-center gap-6 text-center">
            {/* Logo */}
            <div className="flex flex-col items-center gap-3">
              <div className="size-16 rounded-2xl flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/lucidity-logo.svg"
                  alt="Lucidity"
                  width={64}
                  height={64}
                  className="size-full object-contain"
                />
              </div>
            </div>

            {/* 404 Message */}
            <div className="space-y-2">
              <h1 className="bg-gradient-to-r from-primary to-secondary text-7xl font-bold text-transparent bg-clip-text">
                404
              </h1>
              <h2 className="text-xl font-semibold text-foreground">
                Page Not Found
              </h2>
              <p className="max-w-xs text-sm text-muted-foreground">
                Oops! The page you're looking for doesn't exist or has been moved.
              </p>
            </div>

            {/* Navigation Options */}
            <div className="w-full space-y-3 mt-4">
              <Link
                href="/"
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <Home className="size-5" />
                Go to Home
              </Link>
              
              <button
                onClick={() => window.history.back()}
                className="flex w-full items-center justify-center gap-2 px-4 py-3 font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft className="size-5" />
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

