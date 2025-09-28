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
    .select("name phone")
    .lean<{ name?: string; phone?: string }>();

  const needsProfile = !user?.name || !user?.phone;
  return NextResponse.json({ authenticated: true, needsProfile });
}
