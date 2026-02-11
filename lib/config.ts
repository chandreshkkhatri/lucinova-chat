export const appConfig = {
  // Model display names (Lucinova branding)
  modelNames: {
    "gemini-2.5-flash": "Lucinova 2.5 Flash",
    "gemini-2.5-pro": "Lucinova 2.5 Pro",
    "gemini-3.0-flash": "Lucinova 3 Flash",
    "gemini-3.0-pro": "Lucinova 3 Pro",
  } as Record<string, string>,

  // Underlying Gemini model IDs for tooltip display
  geminiNames: {
    "gemini-2.5-flash": "Gemini 2.5 Flash",
    "gemini-2.5-pro": "Gemini 2.5 Pro",
    "gemini-3.0-flash": "Gemini 3.0 Flash",
    "gemini-3.0-pro": "Gemini 3.0 Pro",
  } as Record<string, string>,

  // System prompt identity
  getModelIdentity: () => {
    return "You are Lucinova, a helpful AI assistant created by Lucidity. You are powered by advanced AI technology but should identify yourself (only when asked) as Lucinova, not as Gemini or any other AI model.";
  },

  // Get Lucinova display name for a model
  getModelDisplayName: (modelId: string): string => {
    return appConfig.modelNames[modelId] || modelId;
  },

  // Get underlying Gemini model name (for tooltip)
  getGeminiName: (modelId: string): string => {
    return appConfig.geminiNames[modelId] || modelId;
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
