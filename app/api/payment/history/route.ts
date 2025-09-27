import { NextResponse } from "next/server";

import { auth } from "@/app/(auth)/auth";
import { getPaymentsByEmail } from "@/db/queries";

export async function GET() {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payments = await getPaymentsByEmail(email, 100);
    return NextResponse.json({ payments });
  } catch (err: any) {
    console.error("Failed to fetch billing history:", err?.message || err);
    return NextResponse.json(
      { error: "Failed to fetch billing history" },
      { status: 500 }
    );
  }
}
