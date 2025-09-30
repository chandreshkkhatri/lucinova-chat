import { Metadata } from "next";

import { auth } from "@/app/(auth)/auth";
import { getUserByEmail } from "@/db/queries";

import AccountClient from "./account-client";

export const metadata: Metadata = {
  title: "Account Settings",
  description: "Manage your Delibration account settings and preferences.",
};

export default async function AccountPage() {
  const session = await auth();
  const baseUser = session?.user || ({} as any);

  // Enrich with subscription info from DB (best-effort)
  if (baseUser?.email) {
    try {
      const dbUser: any = await getUserByEmail(baseUser.email);
      if (dbUser && !Array.isArray(dbUser)) {
        baseUser.plan = dbUser.plan || "free";
        baseUser.isPro = !!dbUser.isPro;
        baseUser.currentPeriodEnd = dbUser.currentPeriodEnd || null;
        baseUser.name = dbUser.name || baseUser.name;
        baseUser.phone = dbUser.phone || null;
        baseUser.countryCode = dbUser.countryCode || null;
      }
    } catch {}
  }

  return <AccountClient user={baseUser} />;
}
