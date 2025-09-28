import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/app/(auth)/auth";
import { ensureConnection } from "@/db/connection";
import { User } from "@/db/models";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await ensureConnection();
  const user = await User.findOne({ email: session.user.email })
    .select("email displayName name phone")
    .lean();
  return NextResponse.json({ user });
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const name = typeof body.name === "string" ? body.name.trim() : undefined;
  const phone = typeof body.phone === "string" ? body.phone.trim() : undefined;

  if (!name || !phone) {
    return NextResponse.json(
      { error: "Name and phone are required" },
      { status: 400 }
    );
  }

  // Basic phone validation (India 10-digit without country code)
  const phoneDigits = phone.replace(/\D/g, "");
  if (!/^[6-9]\d{9}$/.test(phoneDigits)) {
    return NextResponse.json(
      { error: "Invalid phone number. Enter 10-digit Indian mobile number." },
      { status: 400 }
    );
  }

  await ensureConnection();
  const updated = await User.findOneAndUpdate(
    { email: session.user.email },
    { $set: { name, phone: phoneDigits } },
    { new: true }
  )
    .select("email displayName name phone")
    .lean();

  return NextResponse.json({ user: updated });
}
