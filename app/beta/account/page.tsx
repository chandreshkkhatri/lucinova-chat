import { Metadata } from "next";

import { auth } from "@/app/(auth)/auth";
import { getUserByEmail } from "@/db/queries";

import AccountClient from "./account-client";

export const metadata: Metadata = {
  title: "Account Settings",
  description: "Manage your Lucidity account settings and preferences.",
};

export default async function AccountPage() {
  const session = await auth();
  const baseUser = session?.user || ({} as any);

  // Enrich with subscription info from DB (best-effort)
  if (baseUser?.email) {
    try {
      console.log("[Account Page] Fetching user data for:", baseUser.email);
      const dbUser: any = await getUserByEmail(baseUser.email);
      console.log("[Account Page] DB user data:", {
        email: dbUser?.email,
        plan: dbUser?.plan,
        isUserPro: dbUser?.isPro,
        currentPeriodEnd: dbUser?.currentPeriodEnd,
        subscriptionStatus: dbUser?.subscriptionStatus,
        subscriptionProvider: dbUser?.subscriptionProvider,
      });

      if (dbUser && !Array.isArray(dbUser)) {
        baseUser.plan = dbUser.plan || "free";
        baseUser.isPro = !!dbUser.isPro;
        baseUser.currentPeriodEnd = dbUser.currentPeriodEnd || null;
        baseUser.name = dbUser.name || baseUser.name;
        baseUser.phone = dbUser.phone || null;
        baseUser.countryCode = dbUser.countryCode || null;
        baseUser.subscriptionStatus = dbUser.subscriptionStatus || null;
        baseUser.subscriptionId = dbUser.subscriptionId || null;

        console.log("[Account Page] Enriched user data:", {
          email: baseUser.email,
          plan: baseUser.plan,
          isPro: baseUser.isPro,
          currentPeriodEnd: baseUser.currentPeriodEnd,
          subscriptionStatus: baseUser.subscriptionStatus,
        });
      }
    } catch (err) {
      console.error("[Account Page] Error fetching user from DB:", err);
    }
  }

  return <AccountClient user={baseUser} />;
}
