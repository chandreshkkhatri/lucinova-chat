import { headers } from "next/headers";
import Link from "next/link";

import { auth } from "@/app/(auth)/auth";
import { PricingSection } from "@/components/pricing-section";
import { getUserByEmail } from "@/db/queries";
import { appConfig } from "@/lib/config";
import { DEFAULT_COUNTRY_CODE } from "@/lib/country-codes";

/**
 * Detect country from request headers (Cloudflare / Vercel).
 * Returns ISO 3166-1 alpha-2 code, e.g. "US", "IN".
 */
async function detectCountry(): Promise<string> {
  try {
    const hdrs = await headers();
    const cfCountry = hdrs.get("cf-ipcountry");
    if (cfCountry && cfCountry !== "XX") return cfCountry.toUpperCase();

    const vercelCountry = hdrs.get("x-vercel-ip-country");
    if (vercelCountry) return vercelCountry.toUpperCase();
  } catch {
    // headers() may throw during static generation
  }
  return DEFAULT_COUNTRY_CODE;
}

export default async function PricingPage() {
  const session = await auth();
  let isUserPro = false;
  let userBadges: any[] = [];
  let subscriptionStatus: string | null = null;

  // Fetch user's Pro status and badges from database
  if (session?.user?.email) {
    try {
      const dbUser: any = await getUserByEmail(session.user.email);
      if (dbUser && !Array.isArray(dbUser)) {
        isUserPro = !!dbUser.isPro;
        userBadges = dbUser.badges || [];
        subscriptionStatus = dbUser.subscriptionStatus || null;
      }
    } catch (err) {
      console.error("[Pricing Page] Error fetching user from DB:", err);
    }
  }

  const isAuthenticated = !!session?.user?.email;

  // Detect country → resolve currency
  const countryCode = await detectCountry();
  const currency = appConfig.getCurrencyForCountry(countryCode);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 pt-20">
      <PricingSection
        isUserPro={isUserPro}
        isAuthenticated={isAuthenticated}
        userBadges={userBadges}
        subscriptionStatus={subscriptionStatus}
        currency={currency}
      />
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
