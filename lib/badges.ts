/**
 * Badge Definitions
 * Central location for all badge definitions and their benefits
 */

export const BADGE_DEFINITIONS = {
  "early-bird": {
    id: "early-bird",
    name: "Early Bird",
    description: "One of the first 500 users to join Lucidity",
    icon: "🐦",
    benefit: {
      type: "discount",
      discount: 0.75, // 75% off
      durationMonths: 3,
      appliesTo: "pro-plan",
    },
  },
} as const;

export type BadgeId = keyof typeof BADGE_DEFINITIONS;

export interface Badge {
  badgeId: string;
  earnedAt: Date;
  metadata?: {
    userRank?: number;
    benefitUsedMonths?: number;
  };
}

/**
 * Check if a badge is defined in the system
 */
export function isBadgeDefined(badgeId: string): boolean {
  return badgeId in BADGE_DEFINITIONS;
}

/**
 * Get badge definition by ID
 */
export function getBadgeDefinition(badgeId: string) {
  return BADGE_DEFINITIONS[badgeId as BadgeId];
}

/**
 * Check if a badge has an active benefit
 */
export function hasBadgeBenefit(
  badge: Badge,
  durationMonths: number = 3
): boolean {
  const benefitUsedMonths = badge.metadata?.benefitUsedMonths || 0;
  return benefitUsedMonths < durationMonths;
}
