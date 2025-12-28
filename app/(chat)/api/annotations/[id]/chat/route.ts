import {
  convertToCoreMessages,
  Message,
  streamText,
  CoreMessage,
} from "ai";

import { getModelById, DEFAULT_MODEL_ID } from "@/ai";
import { auth } from "@/app/(auth)/auth";
import { ensureConnection } from "@/db/connection";
import { Message as DbMessage } from "@/db/models";
import {
  getChatById,
  createMessage,
  getUserByEmail,
  getAnnotationById,
  getAnnotationThreadMessages,
} from "@/db/queries";
import { appConfig } from "@/lib/config";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: annotationId } = await params;
  const { messages, modelId }: { messages: Array<Message>; modelId?: string } =
    await request.json();

  const session = await auth();
  if (!session || !session.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const annotation = await getAnnotationById(annotationId);
  if (!annotation) {
    return new Response("Annotation not found", { status: 404 });
  }

  const chatId = (annotation as any).chatId.toString();
  const messageId = (annotation as any).messageId.toString();
  const selectedText = (annotation as any).selectedText;

  const coreMessages = convertToCoreMessages(messages).filter(
    (message) => message.content.length > 0
  );

  // Persist the user's message
  if (coreMessages.length > 0) {
    const userMsg = coreMessages[coreMessages.length - 1];

    const user = await getUserByEmail(session.user.email!);
    if (!user) {
      return new Response("User not found", { status: 401 });
    }

    const userId = (user as any)._id.toString();

    const toPlainText = (content: any): string => {
      if (typeof content === "string") return content;
      if (Array.isArray(content)) {
        return content
          .filter((p) => p.type === "text")
          .map((p: any) => p.text)
          .join("");
      }
      return "";
    };

    await createMessage({
      chatId,
      senderId: userId,
      parentMsgId: annotationId, // Use annotation ID as parent
      body: toPlainText(userMsg.content),
    });
  }

  // Build context: the parent message + selected text context
  const chatDoc = await getChatById({ id: chatId });

  let additionalContext: Array<CoreMessage> = [];

  if (chatDoc) {
    await ensureConnection();

    // Fetch the parent message (the one containing the selected text)
    const parentDbMsg = await DbMessage.findById(messageId).lean();

    if (parentDbMsg && !Array.isArray(parentDbMsg)) {
      const aiId = (chatDoc as any).aiId?.toString();

      const toCore = (m: any): CoreMessage => ({
        role: m.senderId.toString() === aiId ? "assistant" : "user",
        content: m.body,
      });

      additionalContext = [toCore(parentDbMsg)];
    }
  }

  const fullContext: CoreMessage[] = [...additionalContext, ...coreMessages];

  // Use the requested model or fall back to default
  const model = modelId
    ? getModelById(modelId)
    : getModelById(DEFAULT_MODEL_ID);

  const result = await streamText({
    model,
    system: `${appConfig.getModelIdentity()}
    Today's date is ${new Date().toLocaleDateString()}.

The user has selected this text and is asking about it:
"${selectedText}"

IMPORTANT INSTRUCTIONS:
- Keep responses SHORT and CONCISE (2-4 sentences max for simple questions)
- Get straight to the point - no unnecessary preamble
- Use bullet points for lists instead of paragraphs
- Only elaborate if the user explicitly asks for more detail
- Focus specifically on the selected text and the user's question`,
    messages: fullContext,
    onFinish: async ({ text }) => {
      // Persist AI response
      if (text) {
        await createMessage({
          chatId,
          senderId: (await getChatById({ id: chatId })).aiId.toString(),
          parentMsgId: annotationId,
          body: text,
        });
      }
    },
  });

  return result.toDataStreamResponse();
}
