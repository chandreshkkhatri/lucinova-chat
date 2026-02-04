import "server-only";
import { appConfig } from "./config";

/**
 * Format amount in configured currency
 * @param amount - Amount in cents/paise
 * @param currency - Currency code (defaults to appConfig.pricing.currency)
 * @returns Formatted string (e.g., "$20.00" or "₹2,000.00")
 */
export function formatCurrency(
  amount: number,
  currency?: string
): string {
  const currencyCode = (currency || appConfig.pricing.currency).toUpperCase();
  const majorAmount = amount / 100;
  const locale = getCurrencyLocale(currencyCode);

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currencyCode,
  }).format(majorAmount);
}

/**
 * Format for email display - returns "$20.00" not "USD 20.00"
 */
export function formatCurrencyForEmail(
  amount: number,
  currency?: string
): string {
  const currencyCode = (currency || appConfig.pricing.currency).toUpperCase();
  const symbol = appConfig.getCurrencySymbol(currencyCode);
  const majorAmount = (amount / 100).toFixed(2);

  return `${symbol}${majorAmount}`;
}

/**
 * Get appropriate locale for currency formatting
 */
function getCurrencyLocale(currencyCode: string): string {
  switch (currencyCode.toUpperCase()) {
    case "USD":
      return "en-US";
    case "INR":
      return "en-IN";
    case "EUR":
      return "en-GB";
    case "GBP":
      return "en-GB";
    default:
      return "en-US";
  }
}
