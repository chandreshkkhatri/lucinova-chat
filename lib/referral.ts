import "server-only";
import { ensureConnection } from "@/db/connection";
import { User } from "@/db/models";
import { activateProSubscriptionByEmail } from "@/db/queries";
import { sendBadgeEarnedEmail, sendReferralSuccessEmail } from "@/lib/email";
import { BADGE_DEFINITIONS } from "@/lib/badges";

const CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // No 0/O/1/I/L
const CODE_LENGTH = 8;

/**
 * Generate a random referral code
 */
function generateReferralCode(): string {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CHARSET[Math.floor(Math.random() * CHARSET.length)];
  }
  return code;
}

/**
 * Get or create a referral code for a user (lazy generation)
 */
export async function getOrCreateReferralCode(email: string): Promise<string> {
  await ensureConnection();
  const normalizedEmail = String(email).trim().toLowerCase();

  // Check if user already has a referral code
  const user = await User.findOne({ email: normalizedEmail })
    .select("referralCode")
    .lean() as any;

  if (user?.referralCode) {
    return user.referralCode;
  }

  // Generate a unique code with retry logic
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateReferralCode();
    try {
      const result = await User.findOneAndUpdate(
        { email: normalizedEmail, referralCode: { $exists: false } },
        { $set: { referralCode: code } },
        { new: true }
      ).lean() as any;

      if (result?.referralCode) {
        return result.referralCode;
      }

      // If no update happened, user might already have a code (race condition)
      const recheckUser = await User.findOne({ email: normalizedEmail })
        .select("referralCode")
        .lean() as any;
      if (recheckUser?.referralCode) {
        return recheckUser.referralCode;
      }
    } catch (err: any) {
      // Duplicate key error - retry with a new code
      if (err.code === 11000) continue;
      throw err;
    }
  }

  throw new Error("Failed to generate unique referral code after 5 attempts");
}

/**
 * Look up a user by their referral code
 */
export async function getUserByReferralCode(code: string) {
  await ensureConnection();
  return User.findOne({ referralCode: code.toUpperCase() })
    .select("email displayName referralCode")
    .lean() as any;
}

/**
 * Process a referral after a new user registers
 */
export async function processReferral(
  referrerEmail: string,
  newUserEmail: string
): Promise<void> {
  await ensureConnection();
  const normalizedReferrer = String(referrerEmail).trim().toLowerCase();
  const normalizedNewUser = String(newUserEmail).trim().toLowerCase();

  // Don't allow self-referral
  if (normalizedReferrer === normalizedNewUser) {
    console.log("[Referral] Self-referral attempt blocked:", normalizedNewUser);
    return;
  }

  // Set referredBy on the new user and award "referred-friend" badge
  await User.updateOne(
    { email: normalizedNewUser },
    {
      $set: { referredBy: normalizedReferrer },
      $push: {
        badges: {
          badgeId: "referred-friend",
          earnedAt: new Date(),
          metadata: { benefitUsedMonths: 0 },
        },
      },
    }
  );
  console.log(
    `[Referral] Awarded "referred-friend" badge to ${normalizedNewUser}`
  );

  // Increment referrer's referral count and get updated count
  const referrer = await User.findOneAndUpdate(
    { email: normalizedReferrer },
    { $inc: { referralCount: 1 } },
    { new: true }
  ).lean() as any;

  if (!referrer) {
    console.error("[Referral] Referrer not found:", normalizedReferrer);
    return;
  }

  const newCount = referrer.referralCount || 1;
  console.log(
    `[Referral] ${normalizedReferrer} now has ${newCount} referrals`
  );

  // Check for badge milestones
  const existingBadges = (referrer.badges || []).map((b: any) => b.badgeId);

  // Connector badge at 5 referrals
  if (newCount >= 5 && !existingBadges.includes("connector")) {
    await awardReferralBadge(normalizedReferrer, "connector", referrer.displayName);
  }

  // Ambassador badge at 15 referrals
  if (newCount >= 15 && !existingBadges.includes("ambassador")) {
    await awardReferralBadge(normalizedReferrer, "ambassador", referrer.displayName);
  }

  // Send referral success email to referrer
  const newUser = await User.findOne({ email: normalizedNewUser })
    .select("displayName")
    .lean() as any;

  try {
    await sendReferralSuccessEmail(
      normalizedReferrer,
      referrer.displayName || normalizedReferrer,
      newUser?.displayName || normalizedNewUser,
      newCount
    );
  } catch (err) {
    console.error("[Referral] Failed to send referral success email:", err);
  }
}

/**
 * Award a referral badge and activate free Pro months
 */
async function awardReferralBadge(
  email: string,
  badgeId: string,
  displayName: string
): Promise<void> {
  const badgeDef = BADGE_DEFINITIONS[badgeId];
  if (!badgeDef) return;

  // Award badge
  await User.updateOne(
    { email, "badges.badgeId": { $ne: badgeId } },
    {
      $push: {
        badges: {
          badgeId,
          earnedAt: new Date(),
          metadata: { benefitUsedMonths: 0 },
        },
      },
    }
  );
  console.log(`[Referral] Awarded "${badgeId}" badge to ${email}`);

  // Activate free Pro months if benefit is free-pro
  if (badgeDef.benefit?.type === "free-pro") {
    const freeMonths = badgeDef.benefit.freeMonths;
    const freeDays = freeMonths * 30;
    await activateProSubscriptionByEmail(email, freeDays, "manual");
    console.log(
      `[Referral] Activated ${freeMonths} free Pro month(s) for ${email}`
    );
  }

  // Send badge earned email
  try {
    const benefitText =
      badgeDef.benefit?.type === "free-pro"
        ? `${badgeDef.benefit.freeMonths} free Pro month(s)`
        : undefined;

    await sendBadgeEarnedEmail(email, displayName, {
      badgeName: badgeDef.name,
      badgeIcon: badgeDef.icon,
      description: badgeDef.description,
      benefit: benefitText,
    });
  } catch (err) {
    console.error("[Referral] Failed to send badge earned email:", err);
  }
}
