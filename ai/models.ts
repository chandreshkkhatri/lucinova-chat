// ---------------------------------------------------------------------------
// Model ID Constants (client-safe – no secrets, no server-only imports)
// ---------------------------------------------------------------------------
// All Gemini model identifiers used across the app. Import these instead of
// using raw string literals so renaming a model is a single-line change.
// ---------------------------------------------------------------------------

/** Gemini 3 Pro – best reasoning (Pro-only) */
export const GEMINI_3_PRO_MODEL_ID = "gemini-3-pro-preview";

/** Gemini 3 Flash – fastest & lightweight (default) */
export const GEMINI_3_FLASH_MODEL_ID = "gemini-3-flash-preview";

/** Gemini 3 Pro Image – professional 4K generation (Pro-only) */
export const GEMINI_3_PRO_IMAGE_MODEL_ID = "gemini-3-pro-image-preview";

/** Gemini 2.5 Flash Image – fast image generation */
export const GEMINI_2_5_FLASH_IMAGE_MODEL_ID = "gemini-2.5-flash-image";

/** Gemini 2.5 Flash – previous-gen fast model */
export const GEMINI_2_5_FLASH_MODEL_ID = "gemini-2.5-flash";

/** Gemini 2.5 Pro – previous-gen balanced model */
export const GEMINI_2_5_PRO_MODEL_ID = "gemini-2.5-pro";

/** Gemini 2.5 Flash Lite – hyper-fast, used for titles & suggestions */
export const GEMINI_2_5_FLASH_LITE_MODEL_ID = "gemini-2.5-flash-lite";

// ---------------------------------------------------------------------------
// Environment-overridable model selections
// Note: These use process.env without NEXT_PUBLIC_ prefix, so values will be
// baked in at build time for client bundles (they resolve to the defaults).
// ---------------------------------------------------------------------------

/** Primary (pro) model – overridable via GOOGLE_GEMINI_PRIMARY_MODEL */
export const PRIMARY_MODEL_ID =
  process.env.GOOGLE_GEMINI_PRIMARY_MODEL || GEMINI_3_PRO_MODEL_ID;

/** Fast model – overridable via GOOGLE_GEMINI_FAST_MODEL */
export const FAST_MODEL_ID =
  process.env.GOOGLE_GEMINI_FAST_MODEL || GEMINI_3_FLASH_MODEL_ID;

/** Image model – overridable via GOOGLE_GEMINI_IMAGE_MODEL */
export const IMAGE_MODEL_ID =
  process.env.GOOGLE_GEMINI_IMAGE_MODEL || GEMINI_2_5_FLASH_IMAGE_MODEL_ID;

/** Title model – overridable via GOOGLE_GEMINI_TITLE_MODEL */
export const TITLE_MODEL_ID =
  process.env.GOOGLE_GEMINI_TITLE_MODEL || GEMINI_2_5_FLASH_LITE_MODEL_ID;

/** Default model used when no specific model is requested */
export const DEFAULT_MODEL_ID = FAST_MODEL_ID;
