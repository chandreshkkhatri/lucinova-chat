import {
  convertToModelMessages,
  generateText,
  UIMessage,
  streamText,
  ModelMessage,
} from "ai";

import { geminiProModel, getModelById, DEFAULT_MODEL_ID } from "@/ai";
import { auth } from "@/app/(auth)/auth";
import { ensureConnection } from "@/db/connection";
import { Chat } from "@/db/models";
import {
  createChat,
  createMessage,
  createUser,
  deleteChatById,
  getChatById,
  getUserByEmail,
} from "@/db/queries";
import { appConfig } from "@/lib/config";

/**
 * Convert messages to core format while properly handling audio/file attachments.
 * The default convertToModelMessages may not properly convert audio attachments
 * to file parts that Gemini can understand.
 */
export async function convertMessagesWithAttachments(
  messages: Array<UIMessage>,
): Promise<ModelMessage[]> {
  const coreMessages: ModelMessage[] = [];

  for (const msg of messages) {
    const attachments = (msg as any).experimental_attachments || [];
    if (attachments.length > 0) {
      console.log(
        "[Chat API] Received experimental_attachments:",
        JSON.stringify(attachments, null, 2),
      );
    }
    const msgContent = (msg as any).content || "";

    // Check if there are any audio attachments
    const audioAttachments = attachments.filter((a: any) =>
      a.contentType?.startsWith("audio/"),
    );
    const otherAttachments = attachments.filter(
      (a: any) => !a.contentType?.startsWith("audio/"),
    );

    if (audioAttachments.length > 0 && msg.role === "user") {
      // Build content array with text and audio file parts
      const contentParts: any[] = [];

      // Add text part first
      if (msgContent && msgContent !== "[Voice message]") {
        contentParts.push({
          type: "text",
          text: msgContent,
        });
      } else {
        // For voice-only messages, add a prompt for the AI
        contentParts.push({
          type: "text",
          text: "Please listen to this audio message and respond appropriately:",
        });
      }

      // Add audio file parts
      for (const attachment of audioAttachments) {
        // Extract base64 data from data URL if present
        let audioData = attachment.url;
        if (audioData.startsWith("data:")) {
          // It's a data URL, extract the base64 part
          const base64Match = audioData.match(/^data:[^;]+;base64,(.+)$/);
          if (base64Match) {
            audioData = base64Match[1];
          }
        }

        // Clean content type (remove codecs parameters)
        let mimeType = attachment.contentType || "audio/webm";
        if (mimeType.includes(";")) {
          mimeType = mimeType.split(";")[0].trim();
        }

        contentParts.push({
          type: "file",
          data: audioData,
          mimeType,
        });
      }

      // Add image attachments if any
      for (const attachment of otherAttachments) {
        if (attachment.contentType?.startsWith("image/")) {
          contentParts.push({
            type: "image",
            image: attachment.url,
          });
        }
      }

      coreMessages.push({
        role: "user",
        content: contentParts,
      });
    } else {
      // Use default conversion for non-audio messages
      const converted = await convertToModelMessages([msg]);
      coreMessages.push(...converted);
    }
  }

  return coreMessages.filter((message) => {
    if (typeof message.content === "string") {
      return message.content.length > 0;
    }
    if (Array.isArray(message.content)) {
      return message.content.length > 0;
    }
    return true;
  });
}

export async function POST(request: Request) {
  const {
    id,
    messages,
    modelId,
  }: { id: string; messages: Array<UIMessage>; modelId?: string } =
    await request.json();

  const session = await auth();
  const isGuest = !session || !session.user;

  console.log(
    "[Chat API] Request received - isGuest:",
    isGuest,
    "messageCount:",
    messages.length,
  );

  // Use custom conversion that handles audio attachments properly
  const coreMessages = await convertMessagesWithAttachments(messages);

  console.log(
    "[Chat API] Core messages prepared:",
    JSON.stringify(
      coreMessages.map((m) => ({
        role: m.role,
        contentType: typeof m.content,
        contentLength: Array.isArray(m.content)
          ? m.content.length
          : (m.content as string)?.length,
        parts: Array.isArray(m.content)
          ? m.content.map((p: any) => ({ type: p.type, hasData: !!p.data }))
          : undefined,
      })),
      null,
      2,
    ),
  );

  let userId: string | null = null;

  // Get user info for authenticated users
  if (!isGuest && session?.user?.email) {
    const user = await getUserByEmail(session.user.email);
    if (!user) {
      return new Response("User not found", { status: 401 });
    }
    userId = (user as any)._id.toString();
  }

  console.log(
    "[Chat API] Processing - userId:",
    userId,
    "coreMessages:",
    coreMessages.length,
  );

  // Only persist chat to DB for authenticated users
  if (!isGuest && userId) {
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
          true, // isBot
        );
      }

      chat = await createChat(
        userId,
        (aiUser as any)._id.toString(),
        "New Chat",
        id,
      );
    }

    // Persist the latest user message (the last user role in the array)
    const userMessages = coreMessages.filter(
      (m) => m.role === "user" && m.content,
    );
    const lastUserMsg = userMessages[userMessages.length - 1];

    // Use the raw message for persistence to preserve attachment metadata
    const rawUserMessages = messages.filter((m) => m.role === "user");
    const lastRawUserMsg = rawUserMessages[rawUserMessages.length - 1];

    console.log("[Chat API Debug] Last user message detection:", {
      coreMessagesCount: coreMessages.length,
      userMessagesCount: userMessages.length,
      rawMessagesCount: messages.length,
      rawUserMessagesCount: rawUserMessages.length,
      hasLastUserMsg: !!lastUserMsg,
      hasLastRawUserMsg: !!lastRawUserMsg,
      lastRawUserMsgContent: (lastRawUserMsg as any)?.content?.substring(0, 50),
      // Need to cast because type doesn't know experimental_attachments
      rawAttachments: (lastRawUserMsg as any)?.experimental_attachments?.length,
    });

    let bodyToSave = "";
    let filesToSave: any[] = [];

    // Strategy 1: Try to extract from Raw Message (preserves attachments)
    if (lastRawUserMsg) {
      const textContent = (lastRawUserMsg as any).content || "";
      const attachments =
        (lastRawUserMsg as any).experimental_attachments || [];

      // If textContent is empty but we have attachments, use a placeholder
      if (!textContent && attachments.length > 0) {
        bodyToSave = "[Attachment]";
      } else {
        bodyToSave = textContent;
      }

      if (attachments.length > 0) {
        filesToSave = attachments.map((a: any) => ({
          name: a.name || "file",
          url: a.url,
          mime: a.contentType || "application/octet-stream",
        }));
      }
    }

    // Strategy 2: If Body is still empty, try to extract from Core Message
    // This handles cases where raw message content string is empty, but parts are present (and converted by AI SDK)
    if (!bodyToSave && filesToSave.length === 0 && lastUserMsg) {
      console.log("[Chat API] Falling back to core message content extraction");
      if (typeof lastUserMsg.content === "string") {
        bodyToSave = lastUserMsg.content;
      } else if (Array.isArray(lastUserMsg.content)) {
        bodyToSave = lastUserMsg.content
          .filter((p: any) => p.type === "text")
          .map((p: any) => p.text)
          .join("");
      }
    }

    if (bodyToSave || filesToSave.length > 0) {
      console.log("[Chat API] Persisting fallback user message");
      await createMessage({
        chatId: id,
        senderId: userId,
        body: bodyToSave || " ", // Final safety fallback
        files: filesToSave,
      });
    } else {
      console.log("[Chat API] WARNING: No content to save for user message");
    }
  }

  // Use the requested model or fall back to default
  const model = modelId
    ? getModelById(modelId)
    : getModelById(DEFAULT_MODEL_ID);

  const result = await streamText({
    model,
    system: `${appConfig.getModelIdentity()} You can help with various tasks including answering questions, providing explanations, and assisting with problem-solving. Today's date is ${new Date().toLocaleDateString()}.`,
    messages: coreMessages,
    onFinish: async ({ text }) => {
      // Only persist for authenticated users
      if (isGuest || !userId) return;

      // Persist AI response
      const currentChat = await getChatById({ id });
      if (currentChat && text) {
        await createMessage({
          chatId: id,
          senderId: (currentChat as any).aiId,
          body: text,
        });

        // After the first exchange, generate a title
        if (messages.length === 1) {
          const userMessages = coreMessages.filter(
            (m) => m.role === "user" && m.content,
          );
          const lastUserMsg = userMessages[userMessages.length - 1];

          if (lastUserMsg) {
            const { text: title } = await generateText({
              model: geminiProModel,
              prompt: `Summarize the following conversation with a short, descriptive title (less than 5 words). Do NOT use markdown formatting (no bold **, italics *, etc). Just plain text:\n\nUser: ${String(
                lastUserMsg.content,
              )}\nAssistant: ${text}`,
            });

            await ensureConnection();
            await Chat.findByIdAndUpdate(id, { title });
          }
        }
      }
    },
  });

  // Return a simple text stream that matches TextStreamChatTransport on the client
  return result.toTextStreamResponse();
}

export async function PUT(request: Request) {
  const { id, title } = await request.json();
  const session = await auth();

  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Get the actual user document to ensure we have the MongoDB ObjectId
  const user = await getUserByEmail(session.user.email!);
  if (!user) {
    return new Response("User not found", { status: 401 });
  }

  const userId = (user as any)._id.toString();

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

    // Get the actual user document to ensure we have the MongoDB ObjectId
    const user = await getUserByEmail(session.user.email!);
    if (!user) {
      return new Response("User not found", { status: 401 });
    }

    const userId = (user as any)._id.toString();

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
