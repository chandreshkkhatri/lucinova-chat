import { google } from "@ai-sdk/google";
import { wrapLanguageModel, LanguageModel } from "ai";

import { customMiddleware } from "./custom-middleware";

// Allow overriding model IDs via environment variables, default to supported v1beta models
const PRIMARY_MODEL_ID =
  process.env.GOOGLE_GEMINI_PRIMARY_MODEL || "gemini-3.0-pro";
const FAST_MODEL_ID =
  process.env.GOOGLE_GEMINI_FAST_MODEL || "gemini-3-flash-preview";

// Default model ID used when no specific model is requested
export const DEFAULT_MODEL_ID = FAST_MODEL_ID;

export const geminiProModel = wrapLanguageModel({
  // Use supported model id for v1beta
  model: google(PRIMARY_MODEL_ID) as any,
  middleware: customMiddleware,
});

export const geminiFlashModel = wrapLanguageModel({
  // Use supported model id for v1beta
  model: google(FAST_MODEL_ID) as any,
  middleware: customMiddleware,
});

/**
 * Get a wrapped language model by ID.
 * This allows dynamic model selection based on user preference.
 */
export function getModelById(modelId: string) {
  return wrapLanguageModel({
    model: google(modelId) as any,
    middleware: customMiddleware,
  });
}
