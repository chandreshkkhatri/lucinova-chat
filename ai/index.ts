import { google } from "@ai-sdk/google";
import { experimental_wrapLanguageModel as wrapLanguageModel } from "ai";

import { customMiddleware } from "./custom-middleware";

// Allow overriding model IDs via environment variables, default to supported v1beta models
const PRIMARY_MODEL_ID =
  process.env.GOOGLE_GEMINI_PRIMARY_MODEL || "gemini-2.5-pro";
const FAST_MODEL_ID =
  process.env.GOOGLE_GEMINI_FAST_MODEL || "gemini-2.5-flash";

export const geminiProModel = wrapLanguageModel({
  // Use supported model id for v1beta
  model: google(PRIMARY_MODEL_ID),
  middleware: customMiddleware,
});

export const geminiFlashModel = wrapLanguageModel({
  // Use supported model id for v1beta
  model: google(FAST_MODEL_ID),
  middleware: customMiddleware,
});
