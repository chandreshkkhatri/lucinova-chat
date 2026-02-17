import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { ensureRazorpayClient } from "@/lib/razorpay";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> },
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { invoiceId } = await params;
  if (!invoiceId) {
    return NextResponse.json({ error: "Missing invoice ID" }, { status: 400 });
  }

  const rz = ensureRazorpayClient();
  if ("error" in rz) {
    return NextResponse.json({ error: rz.error }, { status: 500 });
  }

  try {
    // @ts-ignore - SDK might not have perfect types for invoices
    const invoice = await rz.client.invoices.fetch(invoiceId);

    if (!invoice || (!invoice.public_url && !invoice.short_url)) {
      return NextResponse.json(
        { error: "Invoice not found or no URL available" },
        { status: 404 },
      );
    }

    // Return the URL for the client to redirect or open
    return NextResponse.json({
      url: invoice.public_url || invoice.short_url,
      id: invoice.id,
      status: invoice.status,
    });
  } catch (err: any) {
    console.error("[Invoice API] Error fetching invoice:", err.message || err);
    return NextResponse.json(
      { error: "Failed to fetch invoice information from Razorpay" },
      { status: 500 },
    );
  }
}
