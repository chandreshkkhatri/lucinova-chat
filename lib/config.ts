import {
  GEMINI_2_5_FLASH_IMAGE_MODEL_ID,
  GEMINI_2_5_FLASH_MODEL_ID,
  GEMINI_2_5_PRO_MODEL_ID,
  GEMINI_3_FLASH_MODEL_ID,
  GEMINI_3_PRO_IMAGE_MODEL_ID,
  GEMINI_3_PRO_MODEL_ID,
} from "@/ai/models";

/**
 * Supported currency codes for pricing
 */
export type SupportedCurrency = "USD" | "INR";

/**
 * Pricing tier for a specific currency
 */
export interface CurrencyPricing {
  /** Price in major currency unit (e.g., 20 for $20, 999 for ₹999) */
  price: number;
  /** Price in smallest currency unit (cents/paise) */
  priceInSmallestUnit: number;
  /** Early Bird discounted price in major currency unit (e.g., 5 for $5, 249 for ₹249) */
  earlyBirdPrice: number;
  /** Early Bird discounted price in smallest currency unit */
  earlyBirdPriceInSmallestUnit: number;
  /** ISO currency code */
  currency: SupportedCurrency;
  /** Currency symbol */
  symbol: string;
  /** Razorpay Plan ID env var name for this currency */
  razorpayPlanId: string | undefined;
  /** Razorpay Early Bird Plan ID for this currency */
  razorpayEarlyBirdPlanId: string | undefined;
  /** Tax note to display (e.g., "Plus applicable taxes" or "Inclusive of GST") */
  taxNote: string;
}

export const appConfig = {
  // Model display names (Lucinova branding)
  modelNames: {
    [GEMINI_2_5_FLASH_MODEL_ID]: "Lucinova 2.5 Flash",
    [GEMINI_2_5_PRO_MODEL_ID]: "Lucinova 2.5 Pro",
    [GEMINI_3_FLASH_MODEL_ID]: "Lucinova 3 Flash",
    [GEMINI_3_PRO_MODEL_ID]: "Lucinova 3 Pro",
    [GEMINI_3_PRO_IMAGE_MODEL_ID]: "Lucinova 3 Image Pro",
    [GEMINI_2_5_FLASH_IMAGE_MODEL_ID]: "Lucinova 2.5 Image Flash",
  } as Record<string, string>,

  // Model descriptions for selection
  modelDescriptions: {
    [GEMINI_2_5_FLASH_MODEL_ID]: "Previous gen fast",
    [GEMINI_2_5_PRO_MODEL_ID]: "Balanced performance",
    [GEMINI_3_FLASH_MODEL_ID]: "Fastest & lightweight",
    [GEMINI_3_PRO_MODEL_ID]: "Best reasoning",
    [GEMINI_3_PRO_IMAGE_MODEL_ID]: "Professional 4K generation",
    [GEMINI_2_5_FLASH_IMAGE_MODEL_ID]: "Fast image generation",
  } as Record<string, string>,

  // System prompt identity
  getModelIdentity: () => {
    return "You are Lucinova, a helpful AI assistant created by Lucidity. You are powered by advanced AI technology but should identify yourself (only when asked) as Lucinova, not as Gemini or any other AI model.";
  },

  // Get Lucinova display name for a model
  getModelDisplayName: (modelId: string): string => {
    return appConfig.modelNames[modelId] || modelId;
  },

  // Get model description
  getModelDescription: (modelId: string): string => {
    return appConfig.modelDescriptions[modelId] || "";
  },

  // Pricing & currency configuration
  // Default pricing (USD) for backward compatibility
  pricing: {
    // Public price for client-side display (in major currency unit, e.g., dollars not cents)
    proMonthlyPrice: Number(
      process.env.NEXT_PUBLIC_PRO_MONTHLY_PRICE ||
        process.env.PRO_MONTHLY_PRICE ||
        20,
    ),
    // Currency code and symbol
    currency: (process.env.NEXT_PUBLIC_CURRENCY || "USD").toUpperCase() as SupportedCurrency,
  },

  // Multi-currency pricing: keyed by currency code
  currencyPricing: {
    USD: {
      price: Number(process.env.NEXT_PUBLIC_PRO_MONTHLY_PRICE || process.env.PRO_MONTHLY_PRICE || 20),
      get priceInSmallestUnit() { return this.price * 100; },
      earlyBirdPrice: 5,
      get earlyBirdPriceInSmallestUnit() { return this.earlyBirdPrice * 100; },
      currency: "USD" as SupportedCurrency,
      symbol: "$",
      razorpayPlanId: process.env.RAZORPAY_PLAN_ID,
      razorpayEarlyBirdPlanId: process.env.RAZORPAY_EARLY_BIRD_PLAN_ID,
      taxNote: "Plus applicable taxes",
    },
    INR: {
      price: Number(process.env.NEXT_PUBLIC_PRO_MONTHLY_PRICE_INR || process.env.PRO_MONTHLY_PRICE_INR || 999),
      get priceInSmallestUnit() { return this.price * 100; },
      earlyBirdPrice: 249,
      get earlyBirdPriceInSmallestUnit() { return this.earlyBirdPrice * 100; },
      currency: "INR" as SupportedCurrency,
      symbol: "₹",
      razorpayPlanId: process.env.RAZORPAY_PLAN_ID_INR,
      razorpayEarlyBirdPlanId: process.env.RAZORPAY_EARLY_BIRD_PLAN_ID_INR,
      taxNote: "Inclusive of GST",
    },
  } satisfies Record<SupportedCurrency, CurrencyPricing>,

  /**
   * Get pricing for a specific currency. Falls back to USD for unsupported currencies.
   */
  getPricingForCurrency: (currency: string): CurrencyPricing => {
    const code = currency.toUpperCase() as SupportedCurrency;
    return appConfig.currencyPricing[code] || appConfig.currencyPricing.USD;
  },

  /**
   * Resolve which currency to use for a given country code.
   * IN → INR, all others → USD (since Razorpay supports international cards in USD).
   */
  getCurrencyForCountry: (countryCode: string): SupportedCurrency => {
    switch (countryCode.toUpperCase()) {
      case "IN":
        return "INR";
      default:
        return "USD";
    }
  },

  // Helpers
  getCurrencySymbol: (code?: string) => {
    const c = (code || appConfig.pricing.currency).toUpperCase();
    switch (c) {
      case "INR":
        return "₹";
      case "USD":
        return "$";
      case "EUR":
        return "€";
      case "GBP":
        return "£";
      default:
        return c + " ";
    }
  },
};
