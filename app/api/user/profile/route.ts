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
    .select("email displayName name phone countryCode")
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
  const countryCode = typeof body.countryCode === "string" ? body.countryCode.trim() : "+91";
  const acceptTerms = body.acceptTerms === true;

  if (!name || !phone) {
    return NextResponse.json(
      { error: "Name and phone are required" },
      { status: 400 }
    );
  }

  // Basic phone validation (10-digit without country code)
  const phoneDigits = phone.replace(/\D/g, "");
  if (!/^\d{10}$/.test(phoneDigits)) {
    return NextResponse.json(
      { error: "Invalid phone number. Enter 10-digit mobile number." },
      { status: 400 }
    );
  }

  await ensureConnection();

  // Check if phone number is already used by another user
  const existingUser = await User.findOne({
    phone: phoneDigits,
    email: { $ne: session.user.email },
  }).lean();

  if (existingUser) {
    return NextResponse.json(
      { error: "This phone number is already registered to another account." },
      { status: 409 }
    );
  }

  // Build the update object
  const updateFields: Record<string, any> = { name, phone: phoneDigits, countryCode };
  if (acceptTerms) {
    updateFields.termsAcceptedAt = new Date();
  }

  const updated = await User.findOneAndUpdate(
    { email: session.user.email },
    { $set: updateFields },
    { new: true }
  )
    .select("email displayName name phone countryCode termsAcceptedAt")
    .lean();

  return NextResponse.json({ user: updated });
}
