import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/app/(auth)/auth";
import { getChatById, saveCanvasPositions, getCanvasPositions } from "@/db/queries";

/**
 * GET /api/chat/canvas-positions?chatId=<id>
 * Returns the persisted canvas node positions for a chat.
 */
export async function GET(request: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const chatId = request.nextUrl.searchParams.get("chatId");
  if (!chatId) {
    return NextResponse.json({ error: "chatId required" }, { status: 400 });
  }

  // Verify ownership
  const chat = await getChatById({ id: chatId });
  if (!chat || (chat as any).userId?.toString() !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const positions = await getCanvasPositions(chatId);
  return NextResponse.json({ positions: positions ?? {} });
}

/**
 * PUT /api/chat/canvas-positions
 * Persists canvas node positions for a chat.
 * Body: { chatId: string, positions: Record<string, { x: number; y: number }> }
 */
export async function PUT(request: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { chatId, positions } = body;

  if (!chatId || !positions || typeof positions !== "object") {
    return NextResponse.json(
      { error: "chatId and positions required" },
      { status: 400 },
    );
  }

  // Verify ownership
  const chat = await getChatById({ id: chatId });
  if (!chat || (chat as any).userId?.toString() !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await saveCanvasPositions(chatId, positions);
  return NextResponse.json({ ok: true });
}
