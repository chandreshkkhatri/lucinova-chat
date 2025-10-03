import Link from "next/link";

import { PricingSection } from "@/components/pricing-section";

export default async function PricingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 pt-20">
      <PricingSection />
      <footer className="w-full max-w-4xl mx-auto mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
          <Link
            href="/legal"
            className="hover:text-gray-900 dark:hover:text-gray-200 underline"
          >
            Legal Documents
          </Link>
          {" • "}
          <Link
            href="/privacy"
            className="hover:text-gray-900 dark:hover:text-gray-200 underline"
          >
            Privacy Policy
          </Link>
          {" • "}
          <Link
            href="/legal/terms-and-conditions"
            className="hover:text-gray-900 dark:hover:text-gray-200 underline"
          >
            Terms & Conditions
          </Link>
        </div>
      </footer>
    </main>
  );
}