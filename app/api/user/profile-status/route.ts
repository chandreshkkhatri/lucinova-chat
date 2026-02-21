import { NextResponse } from "next/server";

import { auth } from "@/app/(auth)/auth";
import { ensureConnection } from "@/db/connection";
import { User } from "@/db/models";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ authenticated: false, needsProfile: false });
  }

  await ensureConnection();
  const user = await User.findOne({ email: session.user.email })
    .select("name phone termsAcceptedAt")
    .lean<{ name?: string; phone?: string; termsAcceptedAt?: Date }>();

  // Only require name (phone is optional in the profile modal).
  // Also check termsAcceptedAt so users who accepted T&C aren't re-prompted.
  const needsProfile = !user?.name?.trim() || !user?.termsAcceptedAt;
  return NextResponse.json({ authenticated: true, needsProfile });
}
