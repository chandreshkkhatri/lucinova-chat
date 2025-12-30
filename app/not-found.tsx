"use client";

import Link from "next/link";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
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
              <h1 className="text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
                404
              </h1>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Page Not Found
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 max-w-xs">
                Oops! The page you're looking for doesn't exist or has been moved.
              </p>
            </div>

            {/* Navigation Options */}
            <div className="w-full space-y-3 mt-4">
              <Link
                href="/"
                className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                <Home className="size-5" />
                Go to Home
              </Link>
              
              <button
                onClick={() => window.history.back()}
                className="flex items-center justify-center gap-2 w-full py-3 px-4 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors font-medium"
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

