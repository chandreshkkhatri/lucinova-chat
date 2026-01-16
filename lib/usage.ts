/**
 * Usage calculation utilities for tracking API costs as units.
 * 1000 units = 400 INR cost to the application.
 */

// Pricing per million tokens (USD) - based on Gemini pricing
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  "gemini-2.0-flash": { input: 0.075, output: 0.3 },
  "gemini-2.5-flash": { input: 0.075, output: 0.3 },
  "gemini-2.5-pro": { input: 1.25, output: 10.0 },
  "gemini-3.0-flash": { input: 0.075, output: 0.3 },
  "gemini-3.0-pro": { input: 1.25, output: 10.0 },
};

// 1 unit = ~$0.0048 USD (400 INR / 1000 units, at ~83 INR/USD)
const UNIT_COST_USD = 0.0048;

// Usage limits per plan (units per month)
export const USAGE_LIMITS = {
  free: 1000,
  pro: 5000,
};

/**
 * Calculate units from token usage based on model pricing.
 * @param modelId - The Gemini model ID
 * @param inputTokens - Number of input/prompt tokens
 * @param outputTokens - Number of output/completion tokens
 * @returns Number of units consumed (rounded up to 2 decimal places)
 */
export function calculateUnitsFromTokens(
  modelId: string,
  inputTokens: number,
  outputTokens: number
): number {
  // Default to flash pricing if model not found
  const pricing = MODEL_PRICING[modelId] || MODEL_PRICING["gemini-2.5-flash"];

  // Calculate cost in USD
  const inputCost = (inputTokens / 1_000_000) * pricing.input;
  const outputCost = (outputTokens / 1_000_000) * pricing.output;
  const totalCostUSD = inputCost + outputCost;

  // Convert to units (round up to nearest 0.01 unit)
  const units = Math.ceil((totalCostUSD / UNIT_COST_USD) * 100) / 100;

  return units;
}

/**
 * Get the usage limit for a user based on their plan.
 * @param isPro - Whether the user is on the Pro plan
 * @returns The monthly unit limit
 */
export function getUserLimit(isPro: boolean): number {
  return isPro ? USAGE_LIMITS.pro : USAGE_LIMITS.free;
}
