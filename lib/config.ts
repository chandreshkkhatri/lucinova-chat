// Read from environment variable, default to 'custom' if not set
const modelDisplayMode = process.env.NEXT_PUBLIC_MODEL_DISPLAY_MODE || "custom";
const useCustomModelNames = modelDisplayMode === "custom";

export const appConfig = {
  // Model display configuration from environment variable
  useCustomModelNames,

  // Model name mappings
  modelNames: {
    custom: {
      "gemini-2.0-flash": "Tara 2.0 Flash",
      "gemini-2.5-flash": "Tara 2.5 Flash",
      "gemini-2.5-pro": "Tara 2.5 Pro",
    } as Record<string, string>,
    original: {
      "gemini-2.0-flash": "Gemini 2.0 Flash",
      "gemini-2.5-flash": "Gemini 2.5 Flash",
      "gemini-2.5-pro": "Gemini 2.5 Pro",
    } as Record<string, string>,
  },

  // System prompt identity configuration
  getModelIdentity: () => {
    if (useCustomModelNames) {
      return "Tara, a helpful AI assistant created by Delibration. You are powered by advanced AI technology but should identify yourself as Tara, not as Gemini or any other AI model.";
    } else {
      return "a helpful AI assistant powered by Gemini.";
    }
  },

  // Get display name for a model
  getModelDisplayName: (modelId: string): string => {
    const nameMap = useCustomModelNames
      ? appConfig.modelNames.custom
      : appConfig.modelNames.original;
    return nameMap[modelId] || modelId;
  },
};
