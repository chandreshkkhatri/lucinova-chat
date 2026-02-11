// Google Ads Conversion Tracking Utility

import { appConfig } from "./config";

declare global {
  interface Window {
    gtag: (
      command: "event" | "config" | "js",
      targetId: string,
      config?: Record<string, unknown>
    ) => void;
    dataLayer: unknown[];
  }
}

const GOOGLE_ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;

/**
 * Track a Google Ads conversion event
 */
export function trackConversion(
  conversionLabel: string,
  value?: number,
  currency?: string
) {
  if (typeof window === "undefined" || !window.gtag || !GOOGLE_ADS_ID) {
    return;
  }

  window.gtag("event", "conversion", {
    send_to: `${GOOGLE_ADS_ID}/${conversionLabel}`,
    ...(value !== undefined && { value }),
    ...(currency && { currency }),
  });
}

/**
 * Track sign-up conversion
 * Call this when a user successfully registers.
 * Returns a promise that resolves after a short delay to allow beacons to fire
 * before any subsequent navigation.
 */
export function trackSignUpConversion(
  method: "email" | "google" = "email"
): Promise<void> {
  const conversionLabel = process.env.NEXT_PUBLIC_GOOGLE_ADS_SIGNUP_LABEL;
  if (conversionLabel) {
    trackConversion(conversionLabel);
  }

  // Also send as a GA4 event for analytics
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", "sign_up", {
      method,
    });
  }

  // Allow time for gtag beacons to be dispatched before navigation
  return new Promise((resolve) => setTimeout(resolve, 300));
}

/**
 * Track purchase/subscription conversion
 * Call this when a user completes a purchase
 */
export function trackPurchaseConversion(
  value: number,
  currency?: string,
  transactionId?: string
) {
  const finalCurrency = currency || appConfig.pricing.currency;
  const conversionLabel = process.env.NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_LABEL;
  if (conversionLabel) {
    trackConversion(conversionLabel, value, finalCurrency);
  }

  // Also send as a GA4 event for analytics
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", "purchase", {
      value,
      currency: finalCurrency,
      transaction_id: transactionId,
    });
  }
}

/**
 * Track a custom event
 */
export function trackEvent(
  eventName: string,
  params?: Record<string, unknown>
) {
  if (typeof window === "undefined" || !window.gtag) {
    return;
  }

  window.gtag("event", eventName, params);
}
