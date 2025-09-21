import { convertToCoreMessages, Message, streamText } from "ai";
import { z } from "zod";

import { geminiProModel } from "@/ai";
import { auth } from "@/app/(auth)/auth";
import {
  deleteChatById,
  getChatById,
  createMessage,
  createChat,
  getUserByEmail,
  createUser,
} from "@/db/queries";
import { appConfig } from "@/lib/config";
import { generateUUID } from "@/lib/utils";
import { getSessionUserId } from "@/lib/get-session-user-id";
import { Chat } from "@/db/models";
import { generateText } from "ai";
import { ensureConnection } from "@/db/connection";

export async function POST(request: Request) {
  const { id, messages }: { id: string; messages: Array<Message> } =
    await request.json();

  const session = await auth();

  if (!session || !session.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const coreMessages = convertToCoreMessages(messages).filter(
    (message) => message.content.length > 0
  );

  const userId = getSessionUserId(session);

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  /**
   * Ensure that a Chat document exists for this conversation.
   * We use the client-generated id so that front-end routing continues to work.
   */
  let chat = await getChatById({ id });

  if (!chat) {
    // Find or create the single AI user that represents the assistant
    let aiUser = await getUserByEmail("ai@assistant.local");

    if (!aiUser) {
      aiUser = await createUser(
        "ai@assistant.local",
        undefined, // password
        "AI Assistant", // displayName
        undefined, // avatarUrl
        true // isBot
      );
    }

    chat = await createChat(
      userId,
      (aiUser as any)._id.toString(),
      "New Chat",
      id
    );
  }

  // Persist the latest user message (the last user role in the array)
  const userMessages = coreMessages.filter(
    (m) => m.role === "user" && m.content
  );
  const lastUserMsg = userMessages[userMessages.length - 1];

  if (lastUserMsg) {
    await createMessage({
      chatId: id,
      senderId: userId,
      body: String(lastUserMsg.content),
    });
  }

  const result = await streamText({
    model: geminiProModel,
    system: `You are ${appConfig.getModelIdentity()} You can help with various tasks including answering questions, providing explanations, and assisting with problem-solving. Today's date is ${new Date().toLocaleDateString()}.`,
    messages: coreMessages,
    onFinish: async ({ usage, finishReason, responseMessages }) => {
      // Persist AI response messages
      const currentChat = await getChatById({ id });
      if (currentChat) {
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
            chatId: id,
            senderId: (currentChat as any).aiId,
            body: toPlainText(msg.content),
          });
        }

        // After the first exchange, generate a title
        if (messages.length === 1) {
          const { text: title } = await generateText({
            model: geminiProModel,
            prompt: `Summarize the following conversation with a short, descriptive title (less than 5 words):\n\nUser: ${String(
              lastUserMsg.content
            )}\nAssistant: ${toPlainText(responseMessages[0].content)}`,
          });

          await ensureConnection();
          await Chat.findByIdAndUpdate(id, { title });
        }
      }
    },
    experimental_telemetry: {
      isEnabled: true,
      functionId: "stream-text",
    },
  });

  return result.toDataStreamResponse({});
}

export async function PUT(request: Request) {
  const { id, title } = await request.json();
  const session = await auth();

  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const userId = getSessionUserId(session);

  const chat = await getChatById({ id });

  if (!chat || chat.userId.toString() !== userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  await ensureConnection();
  await Chat.findByIdAndUpdate(id, { title });

  return new Response("OK", { status: 200 });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return new Response("Not Found", { status: 404 });
  }

  const session = await auth();

  if (!session || !session.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const chat = await getChatById({ id });

    if (!chat) {
      return new Response("Chat not found", { status: 404 });
    }

    const userId = getSessionUserId(session);

    if ((chat as any).userId.toString() !== userId) {
      return new Response("Unauthorized", { status: 401 });
    }

    await deleteChatById({ id });

    return new Response("Chat deleted", { status: 200 });
  } catch (error) {
    return new Response("An error occurred while processing your request", {
      status: 500,
    });
  }
}
