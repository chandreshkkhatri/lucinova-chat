import { convertToCoreMessages, Message, streamText, CoreMessage } from "ai";

import { geminiProModel } from "@/ai";
import { auth } from "@/app/(auth)/auth";
import { getChatById, createMessage, getUserByEmail, deleteThreadMessages } from "@/db/queries";
import { appConfig } from "@/lib/config";
import { Message as DbMessage } from "@/db/models";
import { ensureConnection } from "@/db/connection";

export async function POST(request: Request) {
  const {
    messages,
    parentMessageId,
    mainChatId,
    selectedText,
  }: {
    messages: Array<Message>;
    parentMessageId: string;
    mainChatId: string;
    selectedText?: string;
  } = await request.json();

  const session = await auth();

  if (!session || !session.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const coreMessages = convertToCoreMessages(messages).filter(
    (message) => message.content.length > 0
  );

  // Persist the user's thread reply
  if (coreMessages.length > 0) {
    const userMsg = coreMessages[coreMessages.length - 1];

    // Get the actual user document to ensure we have the MongoDB ObjectId
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
      chatId: mainChatId,
      senderId: userId,
      parentMsgId: parentMessageId,
      body: toPlainText(userMsg.content),
    });
  }

  // Build extended context: up to four messages before the parent + the parent message itself + the entire thread conversation
  const chatDoc = await getChatById({ id: mainChatId });

  let additionalContext: Array<CoreMessage> = [];

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

      const toCore = (m: any): CoreMessage => ({
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

  const fullContext: CoreMessage[] = [...additionalContext, ...coreMessages];

  const result = await streamText({
    model: geminiProModel,
    system: `You are ${appConfig.getModelIdentity()} You can help with various tasks when requested. Today's date is ${new Date().toLocaleDateString()}.

    IMPORTANT: You are responding in a reply thread.${selectedText ? `\n\nThe user has selected the following text from the parent message and is asking about it:\n"${selectedText}"\n\nFocus your response on this selected text and the user's question about it.` : " Only answer based on the user's follow-up question."}`,
    messages: fullContext,
    onFinish: async ({ responseMessages }) => {
      // Persist AI response(s)
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

      for (const msg of responseMessages) {
        await createMessage({
          chatId: mainChatId,
          senderId: (await getChatById({ id: mainChatId })).aiId.toString(),
          parentMsgId: parentMessageId,
          body: toPlainText(msg.content),
        });
      }
    },
  });

  return result.toDataStreamResponse({});
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
