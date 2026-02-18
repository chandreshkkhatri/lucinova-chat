export const appConfig = {
  // Model display names (Lucinova branding)
  modelNames: {
    "gemini-2.5-flash": "Lucinova 2.5 Flash",
    "gemini-2.5-pro": "Lucinova 2.5 Pro",
    "gemini-3-flash-preview": "Lucinova 3 Flash",
    "gemini-3-pro-preview": "Lucinova 3 Pro",
  } as Record<string, string>,

  // Underlying Gemini model IDs for tooltip display
  geminiNames: {
    "gemini-2.5-flash": "Gemini 2.5 Flash",
    "gemini-2.5-pro": "Gemini 2.5 Pro",
    "gemini-3-flash-preview": "Gemini 3.0 Flash",
    "gemini-3-pro-preview": "Gemini 3.0 Pro",
  } as Record<string, string>,

  // Model descriptions for selection
  modelDescriptions: {
    "gemini-2.5-flash": "Previous gen fast",
    "gemini-2.5-pro": "Balanced performance",
    "gemini-3-flash-preview": "Fastest & lightweight",
    "gemini-3-pro-preview": "Best reasoning",
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

  // Get model description
  getModelDescription: (modelId: string): string => {
    return appConfig.modelDescriptions[modelId] || "";
  },

  // Pricing & currency configuration
  pricing: {
    // Public price for client-side display (in major currency unit, e.g., dollars not cents)
    proMonthlyPrice: Number(
      process.env.NEXT_PUBLIC_PRO_MONTHLY_PRICE ||
        process.env.PRO_MONTHLY_PRICE ||
        20,
    ),
    // Currency code and symbol
    currency: (process.env.NEXT_PUBLIC_CURRENCY || "USD").toUpperCase(),
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
