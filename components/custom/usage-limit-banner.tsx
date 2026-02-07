"use client";

import { AlertTriangle, Crown, Mail } from "lucide-react";
import Link from "next/link";

interface UsageLimitBannerProps {
  isPro: boolean;
  currentUsage: number;
  limit: number;
  periodEnd: Date | string;
}

export function UsageLimitBanner({
  isPro,
  currentUsage,
  limit,
  periodEnd,
}: UsageLimitBannerProps) {
  const resetDate = new Date(periodEnd).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
  });

  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-6 text-center mx-4 mb-4">
      <AlertTriangle className="size-12 mx-auto mb-3 text-amber-500" />
      <h3 className="text-lg font-semibold text-foreground mb-2">
        Usage Limit Reached
      </h3>
      <p className="text-muted-foreground mb-4">
        You've used {currentUsage.toFixed(1)} of your {limit} units this month.
        Your limit resets on {resetDate}.
      </p>

      {isPro ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Need more capacity? Contact us to discuss custom plans.
          </p>
          <a
            href="mailto:support@lucidity.chat"
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-lg font-medium transition-colors"
          >
            <Mail className="size-5" />
            Contact Support
          </a>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Upgrade to Pro for 3x more usage and premium features.
          </p>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-lg font-medium transition-colors"
          >
            <Crown className="size-5" />
            Upgrade to Pro
          </Link>
        </div>
      )}
    </div>
  );
}
