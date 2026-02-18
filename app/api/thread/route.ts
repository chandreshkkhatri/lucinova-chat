import { googleClient, DEFAULT_MODEL_ID } from "@/ai";
import { auth } from "@/app/(auth)/auth";
import { ensureConnection } from "@/db/connection";
import { Message as DbMessage } from "@/db/models";
import {
  getChatById,
  createMessage,
  getUserByEmail,
  deleteThreadMessages,
  getProjectById,
} from "@/db/queries";
import { appConfig } from "@/lib/config";
import { checkUsageLimit, recordUsage } from "@/lib/usage-service";

// Compatibility types
interface UIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  experimental_attachments?: any[];
}

export const maxDuration = 60;

export async function POST(request: Request) {
  const body = await request.json();
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
  } = body;

  const session = await auth();
  if (!session || !session.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Get user info
  const currentUser = await getUserByEmail(session.user.email!);
  if (!currentUser) return new Response("User not found", { status: 401 });
  
  const userId = (currentUser as any)._id.toString();

  // Check usage limit
  const usageCheck = await checkUsageLimit(
    userId,
    currentUser.isPro || false,
    currentUser.currentPeriodStart,
    currentUser.currentPeriodEnd,
  );

  if (!usageCheck.allowed) {
    return Response.json({
        error: "usage_limit_exceeded",
        message: "You have reached your monthly usage limit",
        isPro: currentUser.isPro || false,
        currentUsage: usageCheck.currentUsage,
        limit: usageCheck.limit,
        periodEnd: usageCheck.periodEnd,
      }, { status: 429 });
  }

  // Persist User Message (The last one in the list is the new reply)
  // We filter out empty content or system messages if any
  const userMsg = messages.filter(m => m.role === 'user' && m.content).pop();
  
  if (userMsg) {
    await createMessage({
      chatId: mainChatId,
      senderId: userId,
      parentMsgId: parentMessageId,
      body: userMsg.content,
    });
  }

  // --- Context Construction ---
  const chatDoc = await getChatById({ id: mainChatId });
  let additionalContextGoogle: any[] = [];
  let aiIdString = "";

  if (chatDoc) {
     await ensureConnection();
     aiIdString = (chatDoc as any).aiId?.toString() || "";
     const parentDbMsg = await DbMessage.findById(parentMessageId).lean();

     if (parentDbMsg && !Array.isArray(parentDbMsg)) {
        // Fetch previous context (siblings)
        const prevDbMsgs = await DbMessage.find({
           chatId: mainChatId,
           parentMsgId: null,
           createdAt: { $lt: parentDbMsg.createdAt }
        })
        .sort({ createdAt: -1 })
        .limit(4)
        .lean();

        // Convert DB messages to Google Content
        const toGoogle = (m: any) => ({
           role: m.senderId.toString() === aiIdString ? "model" : "user",
           parts: [{ text: m.body }]
        });

        // Add history: reversed prev messages + parent message
        additionalContextGoogle = [
           ...prevDbMsgs.reverse().map(toGoogle),
           toGoogle(parentDbMsg)
        ];
     }
  }

  // Convert current thread messages to Google Content
  const threadMessagesGoogle = messages
     .filter(m => m.role !== 'system' && m.content)
     .map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
     }));

  const fullGoogleContext = [...additionalContextGoogle, ...threadMessagesGoogle];

  // System Instruction
  const systemInstruction = `${appConfig.getModelIdentity()}
    You can help with various tasks when requested. Today's date is ${new Date().toLocaleDateString()}.

    IMPORTANT: You are responding in a reply thread.${
      selectedText
        ? `\n\nThe user has selected the following text from the parent message and is asking about it:\n"${selectedText}"\n\nFocus your response on this selected text and the user's question about it.`
        : " Only answer based on the user's follow-up question."
    }`;

  const targetModelId = modelId || DEFAULT_MODEL_ID;

  // --- Streaming ---
  try {
     const streamingResponse = await googleClient.models.generateContentStream({
        model: targetModelId,
        contents: fullGoogleContext,
        config: { systemInstruction }
     });

     const stream = new ReadableStream({
        async start(controller) {
           const encoder = new TextEncoder();
           let fullResponseText = "";
           
           try {
              for await (const chunk of streamingResponse) {
                 const text = chunk.text;
                 if (text) {
                    fullResponseText += text;
                    controller.enqueue(encoder.encode(text));
                 }
              }
              
              // Persist AI Response
              if (fullResponseText && aiIdString) {
                  // Usage tracking (mock or estimate)
                  if (currentUser) {
                      // await recordUsage(...)
                  }
                  
                  await createMessage({
                     chatId: mainChatId,
                     senderId: aiIdString,
                     parentMsgId: parentMessageId,
                     body: fullResponseText
                  });
              }
              
              controller.close();
           } catch(err) {
              console.error("[Thread API] Streaming error:", err);
              controller.error(err);
           }
        }
     });

     return new Response(stream, {
        headers: { "Content-Type": "text/plain; charset=utf-8" }
     });

  } catch (error) {
     console.error("[Thread API] Generation error:", error);
     return new Response("Internal Server Error", { status: 500 });
  }
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
