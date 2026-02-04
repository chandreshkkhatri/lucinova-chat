#!/usr/bin/env node
import { MongoClient } from "mongodb";
import { sendBadgeEarnedEmail } from "../lib/email";
import { BADGE_DEFINITIONS } from "../lib/badges";

const BATCH_SIZE = 500; // Number of users to award badge to
const EMAIL_DELAY_MS = 100; // Delay between emails to avoid overwhelming email service

interface UserDocument {
  _id: any;
  email: string;
  name?: string;
  isBot?: boolean;
  createdAt: Date;
  badges?: Array<{
    badgeId: string;
    earnedAt: Date;
    metadata?: {
      userRank?: number;
      benefitUsedMonths?: number;
    };
  }>;
}

async function backfillEarlyBirdBadges() {
  const mongoUrl = process.env.MONGODB_URI;
  if (!mongoUrl) {
    console.error("❌ MONGODB_URI is not set in environment variables");
    process.exit(1);
  }

  let client: MongoClient | null = null;

  try {
    console.log("🚀 Starting Early Bird Badge backfill...\n");

    // Connect to MongoDB
    client = new MongoClient(mongoUrl);
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db();
    const usersCollection = db.collection<UserDocument>("users");

    // Query the first 500 non-bot users sorted by createdAt
    console.log(
      `\n📊 Fetching first ${BATCH_SIZE} non-bot users sorted by creation date...`
    );
    const earlyUsers = await usersCollection
      .find({
        isBot: { $ne: true },
        email: { $exists: true, $ne: null },
      })
      .sort({ createdAt: 1 })
      .limit(BATCH_SIZE)
      .toArray();

    console.log(`✅ Found ${earlyUsers.length} users to potentially update`);

    let awardedCount = 0;
    let skippedCount = 0;
    let emailSentCount = 0;
    let emailFailedCount = 0;

    // Process each user
    for (let i = 0; i < earlyUsers.length; i++) {
      const user = earlyUsers[i];
      const userRank = i + 1;

      // Check if user already has the Early Bird badge
      const hasEarlyBirdBadge = user.badges?.some((b) => b.badgeId === "early-bird");

      if (hasEarlyBirdBadge) {
        console.log(
          `⏭️  User ${userRank}/500 (${user.email}): Already has Early Bird badge. Skipping.`
        );
        skippedCount++;
        continue;
      }

      // Add Early Bird badge to user
      const earlyBirdBadge = {
        badgeId: "early-bird",
        earnedAt: user.createdAt || new Date(),
        metadata: {
          userRank,
          benefitUsedMonths: 0,
        },
      };

      try {
        await usersCollection.updateOne(
          { _id: user._id },
          {
            $push: {
              badges: earlyBirdBadge,
            },
          }
        );

        console.log(
          `✅ User ${userRank}/500 (${user.email}): Early Bird badge awarded`
        );
        awardedCount++;

        // Send badge earned email
        try {
          const badgeDefinition = BADGE_DEFINITIONS["early-bird"];
          await sendBadgeEarnedEmail(user.email, user.name || user.email.split("@")[0], {
            badgeName: badgeDefinition.name,
            badgeIcon: badgeDefinition.icon,
            description: badgeDefinition.description,
            benefit: badgeDefinition.benefit
              ? `${Math.round(badgeDefinition.benefit.discount * 100)}% off ${badgeDefinition.benefit.appliesTo}`
              : undefined,
            userRank,
          });

          console.log(`   📧 Badge earned email sent`);
          emailSentCount++;
        } catch (emailErr) {
          console.error(`   ⚠️  Failed to send email:`, emailErr);
          emailFailedCount++;
        }

        // Add delay between emails
        if (i < earlyUsers.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, EMAIL_DELAY_MS));
        }
      } catch (err) {
        console.error(
          `❌ User ${userRank}/500 (${user.email}): Failed to award badge:`,
          err
        );
      }
    }

    // Print summary
    console.log("\n" + "=".repeat(60));
    console.log("📈 BACKFILL SUMMARY");
    console.log("=".repeat(60));
    console.log(`Total users processed:    ${earlyUsers.length}`);
    console.log(`Badges awarded:           ${awardedCount}`);
    console.log(`Badges skipped (existing): ${skippedCount}`);
    console.log(`Emails sent successfully: ${emailSentCount}`);
    console.log(`Emails failed:            ${emailFailedCount}`);
    console.log("=".repeat(60));

    if (awardedCount === earlyUsers.length && emailSentCount === awardedCount) {
      console.log(
        "\n✅ Backfill completed successfully! All early users have been awarded the Early Bird badge."
      );
    } else if (awardedCount > 0) {
      console.log(
        `\n⚠️  Backfill completed with some issues. ${awardedCount} badges awarded but ${emailFailedCount} emails failed.`
      );
    } else {
      console.log(
        "\n⚠️  No new badges were awarded. All users may already have the badge."
      );
    }
  } catch (error) {
    console.error("\n❌ Fatal error during backfill:", error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log("\n🔌 Disconnected from MongoDB");
    }
  }
}

// Run the backfill
backfillEarlyBirdBadges();
