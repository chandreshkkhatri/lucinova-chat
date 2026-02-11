import { auth } from "@/app/(auth)/auth";
import {
  getAnnotationById,
  deleteAnnotation,
  getAnnotationThreadMessages,
  getAnnotationThreadCount,
} from "@/db/queries";

// GET - Get annotation details and thread messages
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const session = await auth();
  if (!session || !session.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const annotation = await getAnnotationById(id);
  if (!annotation) {
    return Response.json({ error: "Annotation not found" }, { status: 404 });
  }

  const messages = await getAnnotationThreadMessages(id);
  const messageCount = await getAnnotationThreadCount(id);

  return Response.json({
    annotation: {
      id: (annotation as any)._id?.toString() || (annotation as any).id,
      messageId: (annotation as any).messageId.toString(),
      chatId: (annotation as any).chatId.toString(),
      selectedText: (annotation as any).selectedText,
      startOffset: (annotation as any).startOffset,
      endOffset: (annotation as any).endOffset,
      createdAt: (annotation as any).createdAt,
    },
    messages: messages.map((m: any) => ({
      id: m._id.toString(),
      role: m.senderId.toString() === (annotation as any).userId?.toString() ? "user" : "assistant",
      parts: [{ type: "text", text: m.body }],
      createdAt: m.createdAt,
    })),
    messageCount,
  });
}

// DELETE - Delete an annotation and its thread
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const session = await auth();
  if (!session || !session.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const annotation = await getAnnotationById(id);
  if (!annotation) {
    return Response.json({ error: "Annotation not found" }, { status: 404 });
  }

  await deleteAnnotation(id);

  return Response.json({ success: true });
}

