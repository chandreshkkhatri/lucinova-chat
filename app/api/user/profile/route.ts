import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/app/(auth)/auth";
import { ensureConnection } from "@/db/connection";
import { User } from "@/db/models";
import { DEFAULT_COUNTRY_CODE, getCountryByCode, validatePhone } from "@/lib/country-codes";

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await ensureConnection();
  const user = await User.findById(userId)
    .select("email displayName name phone countryCode")
    .lean();
  return NextResponse.json({ user });
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const name = typeof body.name === "string" ? body.name.trim() : undefined;
  const phone = typeof body.phone === "string" ? body.phone.trim() : undefined;
  // countryCode is now ISO country code (e.g., "IN", "US") not dial code
  const countryCode = typeof body.countryCode === "string" ? body.countryCode.trim() : DEFAULT_COUNTRY_CODE;
  const acceptTerms = body.acceptTerms === true;
  const deletePhone = body.deletePhone === true;

  if (!name) {
    return NextResponse.json(
      { error: "Name is required" },
      { status: 400 }
    );
  }

  await ensureConnection();

  // Build the update object
  const updateFields: Record<string, any> = { name };
  const unsetFields: Record<string, any> = {};

  if (acceptTerms) {
    updateFields.termsAcceptedAt = new Date();
  }

  // Handle phone: validate if provided, delete if requested
  if (deletePhone) {
    // Explicitly delete phone
    unsetFields.phone = 1;
    unsetFields.countryCode = 1;
  } else if (phone) {
    // Validate phone number based on country
    const phoneDigits = phone.replace(/\D/g, "");
    const country = getCountryByCode(countryCode);

    if (!validatePhone(phoneDigits, countryCode)) {
      const countryName = country?.name || "your country";
      return NextResponse.json(
        { error: `Invalid phone number for ${countryName}.` },
        { status: 400 }
      );
    }

    // Check if phone number is already used by another user
    const existingUser = await User.findOne({
      phone: phoneDigits,
      _id: { $ne: userId },
    }).select("_id phoneVerifiedAt").lean();

    if (existingUser) {
      // Check if the phone is verified on the other account
      if ((existingUser as any).phoneVerifiedAt) {
        return NextResponse.json(
          { error: "This phone number is verified on another account." },
          { status: 409 }
        );
      }
      // Phone is unverified - clear it from the other account so this user can claim it
      await User.findByIdAndUpdate((existingUser as any)._id, {
        $unset: { phone: 1, countryCode: 1 }
      });
    }

    updateFields.phone = phoneDigits;
    updateFields.countryCode = countryCode;
  }

  // Build update operation
  const updateOp: Record<string, any> = { $set: updateFields };
  if (Object.keys(unsetFields).length > 0) {
    updateOp.$unset = unsetFields;
  }

  const updated = await User.findByIdAndUpdate(
    userId,
    updateOp,
    { new: true }
  )
    .select("email displayName name phone countryCode termsAcceptedAt")
    .lean();

  if (!updated) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ user: updated });
}
