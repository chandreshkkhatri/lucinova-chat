import { NextResponse } from "next/server";

import { auth } from "@/app/(auth)/auth";
import { getUserByEmail } from "@/db/queries";
import { getOrCreateReferralCode } from "@/lib/referral";
import { BADGE_DEFINITIONS } from "@/lib/badges";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser: any = await getUserByEmail(session.user.email);
    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const referralCode = await getOrCreateReferralCode(session.user.email);
    const referralCount = dbUser.referralCount || 0;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://lucidity.chat";
    const referralLink = `${appUrl}/register?ref=${referralCode}`;

    const existingBadges = (dbUser.badges || []).map((b: any) => b.badgeId);

    // Determine next milestone
    let nextBadge: {
      name: string;
      referralsNeeded: number;
      referralsRemaining: number;
    } | null = null;

    if (!existingBadges.includes("connector") && referralCount < 5) {
      nextBadge = {
        name: BADGE_DEFINITIONS["connector"].name,
        referralsNeeded: 5,
        referralsRemaining: 5 - referralCount,
      };
    } else if (!existingBadges.includes("ambassador") && referralCount < 15) {
      nextBadge = {
        name: BADGE_DEFINITIONS["ambassador"].name,
        referralsNeeded: 15,
        referralsRemaining: 15 - referralCount,
      };
    }

    return NextResponse.json({
      referralCode,
      referralCount,
      referralLink,
      nextBadge,
    });
  } catch (error) {
    console.error("[Referral Stats] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
