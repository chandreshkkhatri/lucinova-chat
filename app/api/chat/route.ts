import {
  convertToModelMessages,
  generateText,
  UIMessage,
  streamText,
  ModelMessage,
} from "ai";

import { geminiFlashModel, geminiProModel, getModelById, DEFAULT_MODEL_ID } from "@/ai";
import { auth } from "@/app/(auth)/auth";
import { ensureConnection } from "@/db/connection";
import { Chat } from "@/db/models";
import {
  createChat,
  createMessage,
  createUser,
  deleteChatById,
  getChatById,
  getProjectById,
  getProjectChatSummaries,
  getUserByEmail,
  updateChatProject,
} from "@/db/queries";
import { appConfig } from "@/lib/config";
import { checkUsageLimit, recordUsage } from "@/lib/usage-service";

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
    projectId: requestProjectId,
  }: { id: string; messages: Array<UIMessage>; modelId?: string; projectId?: string } =
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
  let currentUser: any = null;

  // Get user info for authenticated users
  if (!isGuest && session?.user?.email) {
    const user = await getUserByEmail(session.user.email);
    if (!user) {
      return new Response("User not found", { status: 401 });
    }
    const userIdStr = (user as any)._id.toString();
    userId = userIdStr;
    currentUser = user;

    // Check usage limit for authenticated users
    const usageCheck = await checkUsageLimit(
      userIdStr,
      user.isPro || false,
      user.currentPeriodStart,
      user.currentPeriodEnd
    );

    if (!usageCheck.allowed) {
      return Response.json(
        {
          error: "usage_limit_exceeded",
          message: "You have reached your monthly usage limit",
          isPro: user.isPro || false,
          currentUsage: usageCheck.currentUsage,
          limit: usageCheck.limit,
          periodEnd: usageCheck.periodEnd,
        },
        { status: 429 }
      );
    }
  }

  console.log(
    "[Chat API] Processing - userId:",
    userId,
    "coreMessages:",
    coreMessages.length,
  );

  // Only persist chat to DB for authenticated users
  let validatedProjectId: string | undefined;
  let chat: any = null;

  if (!isGuest && userId) {
    // Validate project ownership if a projectId was provided
    if (requestProjectId) {
      try {
        const project = await getProjectById(requestProjectId);
        if (project && (project as any).userId.toString() === userId) {
          validatedProjectId = requestProjectId;
        }
      } catch {
        // Silently ignore invalid projectId
      }
    }

    /**
     * Ensure that a Chat document exists for this conversation.
     * We use the client-generated id so that front-end routing continues to work.
     */
    chat = await getChatById({ id });

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
        validatedProjectId,
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

  // --- Project Memory Retrieval ---
  let projectMemoryContext = "";

  if (!isGuest && userId && chat) {
    const chatProjectId = validatedProjectId || chat?.projectId?.toString();

    if (chatProjectId) {
      try {
        const siblingChatSummaries = await getProjectChatSummaries(chatProjectId, id, 5);

        if (siblingChatSummaries.length > 0) {
          const project = await getProjectById(chatProjectId);
          const projectName = (project as any)?.name || "this project";

          projectMemoryContext = `\n\nYou are working within the project "${projectName}". Here is context from previous conversations in this project:\n\n` +
            siblingChatSummaries
              .map((chat) => `[${chat.title}]: ${chat.summary}`)
              .join("\n") +
            `\n\nUse this context to provide more relevant and consistent responses. Reference previous conversations naturally when relevant, but don't force it.`;
        }
      } catch (err) {
        console.error("[Chat API] Project memory retrieval failed:", err);
      }
    }
  }

  const result = await streamText({
    model,
    system: `${appConfig.getModelIdentity()} You can help with various tasks including answering questions, providing explanations, and assisting with problem-solving. Today's date is ${new Date().toLocaleDateString()}.${projectMemoryContext}`,
    messages: coreMessages,
    onFinish: async ({ text, usage }) => {
      // Only persist for authenticated users
      if (isGuest || !userId) return;

      // Record usage with token counts from the response
      if (usage && currentUser) {
        await recordUsage(
          userId,
          modelId || DEFAULT_MODEL_ID,
          usage.inputTokens || 0,
          usage.outputTokens || 0,
          currentUser.currentPeriodStart,
          currentUser.currentPeriodEnd
        );
      }

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

        // Generate or update summary for project memory
        // Only for chats in a project, at meaningful intervals:
        // first at 4 messages (2 exchanges), then every 6 messages
        const chatProjectId = (currentChat as any).projectId?.toString();
        const totalMessages = messages.length + 1; // +1 for AI response
        const shouldSummarize =
          chatProjectId &&
          totalMessages >= 4 &&
          (totalMessages === 4 || (totalMessages - 4) % 6 === 0);

        if (shouldSummarize) {
          try {
            const existingSummary = (currentChat as any).summary || "";
            const recentMessages = coreMessages.slice(-8);
            const recentText = recentMessages
              .map((m) => `${m.role}: ${typeof m.content === "string" ? m.content : "[complex content]"}`)
              .join("\n");

            const summaryPrompt = existingSummary
              ? `You are updating a summary of an ongoing conversation.\n\nPrevious summary:\n${existingSummary}\n\nNew messages since last summary:\n${recentText}\nAssistant: ${text}\n\nWrite an updated summary (2-4 sentences) covering the key topics, decisions, and context from this conversation. Focus on information useful for future conversations in the same project.`
              : `Summarize this conversation in 2-4 sentences. Focus on key topics discussed, decisions made, and important context. This summary will provide context for future conversations in the same project.\n\n${recentText}\nAssistant: ${text}`;

            const { text: summary } = await generateText({
              model: geminiFlashModel,
              prompt: summaryPrompt,
            });

            await ensureConnection();
            await Chat.findByIdAndUpdate(id, { summary });
          } catch (err) {
            console.error("[Chat API] Summary generation failed:", err);
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

export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return new Response("Unauthorized", { status: 401 });
    }

    const user = await getUserByEmail(session.user.email);
    if (!user) {
      return new Response("User not found", { status: 401 });
    }

    const userId = (user as any)._id.toString();
    const { id, projectId } = await request.json();

    const chat = await getChatById({ id });
    if (!chat || (chat as any).userId.toString() !== userId) {
      return new Response("Unauthorized", { status: 401 });
    }

    // Verify user owns the target project
    if (projectId) {
      const project = await getProjectById(projectId);
      if (!project || (project as any).userId.toString() !== userId) {
        return new Response("Project not found", { status: 404 });
      }
    }

    await updateChatProject(id, projectId || null);
    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("[Chat] PATCH error:", error);
    return new Response("Internal server error", { status: 500 });
  }
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
