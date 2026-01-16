import "server-only";
import {
  getUserUsageStats,
  incrementUsage as dbIncrementUsage,
} from "@/db/queries";
import { calculateUnitsFromTokens, getUserLimit } from "@/lib/usage";

export interface UsageCheckResult {
  allowed: boolean;
  currentUsage: number;
  limit: number;
  remainingUnits: number;
  periodEnd: Date | null;
}

/**
 * Check if a user has remaining usage quota.
 * Returns info about their current usage status.
 */
export async function checkUsageLimit(
  userId: string,
  isPro: boolean,
  currentPeriodStart?: Date | null,
  currentPeriodEnd?: Date | null
): Promise<UsageCheckResult> {
  const stats = await getUserUsageStats(
    userId,
    currentPeriodStart,
    currentPeriodEnd
  );
  const limit = getUserLimit(isPro);
  const remaining = Math.max(0, limit - stats.unitsUsed);

  return {
    // Allow if under limit (this allows the "last message" to go through
    // even if it would exceed the limit)
    allowed: stats.unitsUsed < limit,
    currentUsage: stats.unitsUsed,
    limit,
    remainingUnits: remaining,
    periodEnd: stats.periodEnd,
  };
}

/**
 * Record usage after an AI API call.
 * Calculates units from token counts and stores in database.
 * @returns The number of units consumed by this request
 */
export async function recordUsage(
  userId: string,
  modelId: string,
  inputTokens: number,
  outputTokens: number,
  currentPeriodStart?: Date | null,
  currentPeriodEnd?: Date | null
): Promise<number> {
  const units = calculateUnitsFromTokens(modelId, inputTokens, outputTokens);

  await dbIncrementUsage(
    userId,
    modelId,
    inputTokens,
    outputTokens,
    units,
    currentPeriodStart,
    currentPeriodEnd
  );

  return units;
}
