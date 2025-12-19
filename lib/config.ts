// Read from environment variable, default to 'custom' if not set
const modelDisplayMode = process.env.NEXT_PUBLIC_MODEL_DISPLAY_MODE || "custom";
const useCustomModelNames = modelDisplayMode === "custom";

export const appConfig = {
  // Model display configuration from environment variable
  useCustomModelNames,

  // Model name mappings
  modelNames: {
    custom: {
      "gemini-2.5-flash": "Taara 2.5",
      "gemini-2.5-pro": "Taara 2.5 Pro",
      "gemini-3.0-flash": "Taara 3.0",
      "gemini-3.0-pro": "Taara 3.0 Pro",
    } as Record<string, string>,
    original: {
      "gemini-2.5-flash": "Gemini 2.5 Flash",
      "gemini-2.5-pro": "Gemini 2.5 Pro",
      "gemini-3.0-flash": "Gemini 3.0 Flash",
      "Gemini-3.0-pro": "Gemini 3.0 Pro",
    } as Record<string, string>,
  },

  // System prompt identity configuration
  getModelIdentity: () => {
    if (useCustomModelNames) {
      return "You are Taara, a helpful AI assistant created by Lucidity. You are powered by advanced AI technology but should identify yourself (only when asked) as Taara, not as Gemini or any other AI model.";
    } else {
      return "You are a helpful AI assistant powered by Gemini.";
    }
  },

  // Get display name for a model
  getModelDisplayName: (modelId: string): string => {
    const nameMap = useCustomModelNames
      ? appConfig.modelNames.custom
      : appConfig.modelNames.original;
    return nameMap[modelId] || modelId;
  },

  // Pricing & currency configuration
  pricing: {
    // Public price (in rupees) for client-side display
    proMonthlyRupees: Number(
      process.env.NEXT_PUBLIC_PRO_MONTHLY_PRICE_INR ||
        process.env.PRO_MONTHLY_PRICE_INR ||
        2000
    ),
    // Currency code and symbol
    currency: (process.env.NEXT_PUBLIC_CURRENCY || "INR").toUpperCase(),
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
