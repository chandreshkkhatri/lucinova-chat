import { GoogleGenAI } from "@google/genai";

// Allow overriding model IDs via environment variables
export const PRIMARY_MODEL_ID =
  process.env.GOOGLE_GEMINI_PRIMARY_MODEL || "gemini-3-pro-preview";
export const FAST_MODEL_ID =
  process.env.GOOGLE_GEMINI_FAST_MODEL || "gemini-3-flash-preview";
export const IMAGE_MODEL_ID =
  process.env.GOOGLE_GEMINI_IMAGE_MODEL || "gemini-2.0-flash-exp-image-generation";

// Default model ID used when no specific model is requested
export const DEFAULT_MODEL_ID = FAST_MODEL_ID;

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

if (!apiKey) {
  console.warn("Missing GOOGLE_GENERATIVE_AI_API_KEY environment variable. AI features will fail.");
}

// Initialize the Google GenAI client
export const googleClient = new GoogleGenAI({ apiKey: apiKey || "dummy-key" });

/**
 * Helper to maintain some compatibility or clean usage.
 * Though redundant, it helps centralized model management.
 */
export const googleModels = {
   primary: PRIMARY_MODEL_ID,
   fast: FAST_MODEL_ID,
   image: IMAGE_MODEL_ID,
   imagePro: "gemini-3-pro-image-preview",
   imageFlash: "gemini-2.5-flash-image",
   default: DEFAULT_MODEL_ID
};
