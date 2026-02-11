/**
 * Badge Definitions
 * Central location for all badge definitions and their benefits
 */

interface DiscountBenefit {
  type: "discount";
  discount: number;
  durationMonths: number;
  appliesTo: string;
}

interface FreeProBenefit {
  type: "free-pro";
  freeMonths: number;
  appliesTo: string;
}

export type BadgeBenefit = DiscountBenefit | FreeProBenefit;

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  benefit?: BadgeBenefit;
}

export const BADGE_DEFINITIONS: Record<string, BadgeDefinition> = {
  "early-bird": {
    id: "early-bird",
    name: "Early Bird",
    description: "One of the first 500 users to join Lucidity",
    icon: "🐦",
    benefit: {
      type: "discount",
      discount: 0.75,
      durationMonths: 3,
      appliesTo: "pro-plan",
    },
  },
  "connector": {
    id: "connector",
    name: "Connector",
    description: "Referred 5 friends to Lucidity",
    icon: "🔗",
    benefit: {
      type: "free-pro",
      freeMonths: 1,
      appliesTo: "pro-plan",
    },
  },
  "ambassador": {
    id: "ambassador",
    name: "Ambassador",
    description: "Referred 15 friends to Lucidity",
    icon: "🌟",
    benefit: {
      type: "free-pro",
      freeMonths: 3,
      appliesTo: "pro-plan",
    },
  },
  "referred-friend": {
    id: "referred-friend",
    name: "Referred Friend",
    description: "Joined Lucidity through a friend's referral",
    icon: "🤝",
    benefit: {
      type: "discount",
      discount: 0.5,
      durationMonths: 1,
      appliesTo: "pro-plan",
    },
  },
};

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
export function getBadgeDefinition(badgeId: string): BadgeDefinition | undefined {
  return BADGE_DEFINITIONS[badgeId];
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
