import "server-only";

import { GoogleGenAI } from "@google/genai";

// Re-export all model constants so existing server imports keep working
export {
  GEMINI_3_PRO_MODEL_ID,
  GEMINI_3_FLASH_MODEL_ID,
  GEMINI_3_PRO_IMAGE_MODEL_ID,
  GEMINI_2_5_FLASH_IMAGE_MODEL_ID,
  GEMINI_2_5_FLASH_MODEL_ID,
  GEMINI_2_5_PRO_MODEL_ID,
  GEMINI_2_5_FLASH_LITE_MODEL_ID,
  PRIMARY_MODEL_ID,
  FAST_MODEL_ID,
  IMAGE_MODEL_ID,
  TITLE_MODEL_ID,
  DEFAULT_MODEL_ID,
} from "./models";

import {
  PRIMARY_MODEL_ID,
  FAST_MODEL_ID,
  IMAGE_MODEL_ID,
  TITLE_MODEL_ID,
  GEMINI_3_PRO_IMAGE_MODEL_ID,
  DEFAULT_MODEL_ID,
} from "./models";

// ---------------------------------------------------------------------------
// Google GenAI Client (server-only)
// ---------------------------------------------------------------------------

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

if (!apiKey) {
  console.warn("Missing GOOGLE_GENERATIVE_AI_API_KEY environment variable. AI features will fail.");
}

export const googleClient = new GoogleGenAI({ apiKey: apiKey || "dummy-key" });

// ---------------------------------------------------------------------------
// Convenience map – keeps backward compat for code using googleModels.*
// ---------------------------------------------------------------------------
export const googleModels = {
  primary: PRIMARY_MODEL_ID,
  fast: FAST_MODEL_ID,
  image: IMAGE_MODEL_ID,
  title: TITLE_MODEL_ID,
  imagePro: GEMINI_3_PRO_IMAGE_MODEL_ID,
  default: DEFAULT_MODEL_ID,
};
