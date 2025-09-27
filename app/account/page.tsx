import { Metadata } from "next";
import { auth } from "@/app/(auth)/auth";
import AccountClient from "./account-client";

export const metadata: Metadata = {
  title: "Account Settings",
  description: "Manage your Delibration account settings and preferences.",
};

export default async function AccountPage() {
  const session = await auth();

  return <AccountClient user={session?.user || {}} />;
}