// @ts-ignore
import { convertToModelMessages, UIMessage, streamText } from "ai";

import { getModelById, DEFAULT_MODEL_ID } from "@/ai";
import { auth } from "@/app/(auth)/auth";
import { ensureConnection } from "@/db/connection";
import { Message as DbMessage } from "@/db/models";
import {
  getChatById,
  createMessage,
  getUserByEmail,
  deleteThreadMessages,
} from "@/db/queries";
import { appConfig } from "@/lib/config";
import { checkUsageLimit, recordUsage } from "@/lib/usage-service";

export async function POST(request: Request) {
  const {
    messages,
    parentMessageId,
    mainChatId,
    selectedText,
    modelId,
  }: {
    messages: Array<UIMessage>;
    parentMessageId: string;
    mainChatId: string;
    selectedText?: string;
    modelId?: string;
  } = await request.json();

  const session = await auth();

  if (!session || !session.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const coreMessages = (await convertToModelMessages(messages)).filter(
    (message) => message.content.length > 0,
  );

  // Get the actual user document to ensure we have the MongoDB ObjectId
  const currentUser = await getUserByEmail(session.user.email!);
  if (!currentUser) {
    return new Response("User not found", { status: 401 });
  }

  const userId = (currentUser as any)._id.toString();

  // Check usage limit
  const usageCheck = await checkUsageLimit(
    userId,
    currentUser.isPro || false,
    currentUser.currentPeriodStart,
    currentUser.currentPeriodEnd,
  );

  if (!usageCheck.allowed) {
    return Response.json(
      {
        error: "usage_limit_exceeded",
        message: "You have reached your monthly usage limit",
        isPro: currentUser.isPro || false,
        currentUsage: usageCheck.currentUsage,
        limit: usageCheck.limit,
        periodEnd: usageCheck.periodEnd,
      },
      { status: 429 },
    );
  }

  // Persist the user's thread reply
  if (coreMessages.length > 0) {
    const userMsg = coreMessages[coreMessages.length - 1];

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
      chatId: mainChatId,
      senderId: userId,
      parentMsgId: parentMessageId,
      body: toPlainText(userMsg.content),
    });
  }

  // Build extended context: up to four messages before the parent + the parent message itself + the entire thread conversation
  const chatDoc = await getChatById({ id: mainChatId });

  let additionalContext: Array<any> = [];

  if (chatDoc) {
    // Ensure connection for direct database operations
    await ensureConnection();

    const aiId = (chatDoc as any).aiId?.toString();

    // Fetch the parent message (top-level)
    const parentDbMsg = await DbMessage.findById(parentMessageId).lean();

    if (parentDbMsg && !Array.isArray(parentDbMsg)) {
      // Fetch up to 4 previous top-level messages that occurred before the parent message
      const prevDbMsgs = await DbMessage.find({
        chatId: mainChatId,
        parentMsgId: null,
        createdAt: { $lt: parentDbMsg.createdAt },
      })
        .sort({ createdAt: -1 })
        .limit(4)
        .lean();

      const toCore = (m: any): any => ({
        role: m.senderId.toString() === aiId ? "assistant" : "user",
        content: m.body,
      });

      // Reverse prev messages back to chronological order then map
      additionalContext = [
        ...prevDbMsgs.reverse().map(toCore),
        toCore(parentDbMsg),
      ];
    }
  }

  const fullContext: any[] = [...additionalContext, ...coreMessages];

  // Use the requested model or fall back to default
  const model = modelId
    ? getModelById(modelId)
    : getModelById(DEFAULT_MODEL_ID);

  const result = await streamText({
    model,
    system: `${appConfig.getModelIdentity()}
    You can help with various tasks when requested. Today's date is ${new Date().toLocaleDateString()}.

    IMPORTANT: You are responding in a reply thread.${
      selectedText
        ? `\n\nThe user has selected the following text from the parent message and is asking about it:\n"${selectedText}"\n\nFocus your response on this selected text and the user's question about it.`
        : " Only answer based on the user's follow-up question."
    }`,
    messages: fullContext,
    onFinish: async ({ text, usage }) => {
      // Record usage with token counts from the response
      if (usage) {
        await recordUsage(
          userId,
          modelId || DEFAULT_MODEL_ID,
          usage.inputTokens || 0,
          usage.outputTokens || 0,
          currentUser.currentPeriodStart,
          currentUser.currentPeriodEnd,
        );
      }

      // Persist AI response
      if (text) {
        await createMessage({
          chatId: mainChatId,
          senderId: (await getChatById({ id: mainChatId })).aiId.toString(),
          parentMsgId: parentMessageId,
          body: text,
        });
      }
    },
  });

  return result.toTextStreamResponse();
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const parentMessageId = searchParams.get("parentMessageId");

  if (!parentMessageId) {
    return new Response("Missing parentMessageId", { status: 400 });
  }

  const session = await auth();
  if (!session || !session.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  await deleteThreadMessages(parentMessageId);

  return new Response("Thread deleted", { status: 200 });
}
