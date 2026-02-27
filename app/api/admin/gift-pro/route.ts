import { NextRequest, NextResponse } from "next/server";

import { activateProSubscriptionByEmail, getUserByEmail } from "@/db/queries";
import { sendProGiftEmail, sendProGiftInvitationEmail } from "@/lib/email";

/**
 * Gift Pro Subscription Endpoint
 *
 * Purpose: Give Pro plan to specific users for free (friends, testers, etc.)
 *
 * Security:
 * - Requires ADMIN_SECRET (no payment verification needed)
 *
 * Usage:
 *   POST /api/admin/gift-pro
 *   Body: {
 *     email: "friend@example.com",       // Required
 *     periodInDays: 30,                   // Optional, default 30
 *     adminSecret: "your-admin-secret",   // Required
 *     reason: "Friend & early supporter"  // Optional, for logging
 *   }
 *
 * Bulk gifting:
 *   Body: {
 *     emails: ["a@b.com", "c@d.com"],
 *     periodInDays: 90,
 *     adminSecret: "your-admin-secret"
 *   }
 */

interface GiftRequest {
  email?: string;
  emails?: string[];
  periodInDays?: number;
  adminSecret: string;
  reason?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: GiftRequest = await request.json();
    const {
      email,
      emails,
      periodInDays = 30,
      adminSecret,
      reason,
    } = body;

    // --- Auth ---
    const configuredSecret = process.env.ADMIN_SECRET;
    if (!configuredSecret || adminSecret !== configuredSecret) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    // --- Build email list ---
    const emailList: string[] = [];
    if (email) emailList.push(email);
    if (emails?.length) emailList.push(...emails);

    const uniqueEmails = [
      ...new Set(emailList.map((e) => e.trim().toLowerCase())),
    ];

    if (uniqueEmails.length === 0) {
      return NextResponse.json(
        { error: "Provide 'email' or 'emails' field" },
        { status: 400 },
      );
    }

    // --- Process each email ---
    const results: Array<{
      email: string;
      success: boolean;
      error?: string;
      currentPeriodEnd?: Date | null;
    }> = [];

    for (const addr of uniqueEmails) {
      const existingUser = await getUserByEmail(addr);

      const updated = await activateProSubscriptionByEmail(
        addr,
        periodInDays,
        "gift",
      );

      if (!updated || Array.isArray(updated)) {
        results.push({
          email: addr,
          success: false,
          error: "Activation failed",
        });
        continue;
      }

      // --- Send Gift/Invitation Email ---
      try {
        if (existingUser) {
          await sendProGiftEmail(addr, updated.displayName || addr, {
            periodInDays,
            currentPeriodEnd: updated.currentPeriodEnd!,
            reason,
          });
        } else {
          await sendProGiftInvitationEmail(addr, {
            periodInDays,
            currentPeriodEnd: updated.currentPeriodEnd!,
            reason,
          });
        }
      } catch (emailError) {
        console.error(`[Gift Pro] Failed to send email to ${addr}:`, emailError);
        // We don't fail the whole request for a failed email
      }

      console.log(
        `[Gift Pro] ✅ Gifted ${periodInDays}d Pro to ${addr}${reason ? ` (${reason})` : ""}`,
      );

      results.push({
        email: addr,
        success: true,
        currentPeriodEnd: updated.currentPeriodEnd,
      });
    }

    const succeeded = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    return NextResponse.json({
      success: failed === 0,
      message: `Gifted Pro to ${succeeded}/${uniqueEmails.length} users (${periodInDays} days)`,
      results,
    });
  } catch (error: any) {
    console.error("[Gift Pro] Error:", error);
    return NextResponse.json(
      { error: "Gift failed", message: error.message },
      { status: 500 },
    );
  }
}
