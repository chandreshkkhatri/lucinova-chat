import { auth } from "@/app/(auth)/auth";
import {
  createAnnotation,
  getAnnotationsByChatId,
  getUserByEmail,
} from "@/db/queries";

// GET - List annotations for a chat
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const chatId = searchParams.get("chatId");

  if (!chatId) {
    return Response.json({ error: "Missing chatId" }, { status: 400 });
  }

  const session = await auth();
  if (!session || !session.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const annotations = await getAnnotationsByChatId(chatId);

  return Response.json({
    annotations: annotations.map((a: any) => ({
      id: a._id.toString(),
      messageId: a.messageId.toString(),
      chatId: a.chatId.toString(),
      selectedText: a.selectedText,
      startOffset: a.startOffset,
      endOffset: a.endOffset,
      createdAt: a.createdAt,
      firstMessageText: a.firstMessageText,
    })),
  });
}

// POST - Create a new annotation
export async function POST(request: Request) {
  const session = await auth();
  if (!session || !session.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { messageId, chatId, selectedText, startOffset, endOffset } =
    await request.json();

  if (!messageId || !chatId || !selectedText) {
    return Response.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const user = await getUserByEmail(session.user.email!);
  if (!user) {
    return Response.json({ error: "User not found" }, { status: 401 });
  }

  const userId = (user as any)._id.toString();

  const annotation = await createAnnotation({
    messageId,
    chatId,
    userId,
    selectedText,
    startOffset,
    endOffset,
  });

  return Response.json({
    annotation: {
      id: (annotation as any)._id.toString(),
      messageId: annotation.messageId.toString(),
      chatId: annotation.chatId.toString(),
      selectedText: annotation.selectedText,
      startOffset: annotation.startOffset,
      endOffset: annotation.endOffset,
      createdAt: annotation.createdAt,
    },
  });
}

