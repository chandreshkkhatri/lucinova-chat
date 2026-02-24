import { googleClient, DEFAULT_MODEL_ID } from "@/ai";
import { auth } from "@/app/(auth)/auth";
import { ensureConnection } from "@/db/connection";
import { Message as DbMessage } from "@/db/models";
import {
  getChatById,
  createMessage,
  getUserByEmail,
  getAnnotationById,
} from "@/db/queries";
import { appConfig } from "@/lib/config";
import { checkUsageLimit, recordUsage } from "@/lib/usage-service";

// Compatibility types
interface UIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export const maxDuration = 60;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  // Warm the DB connection once at the top
  await ensureConnection();

  const [{ id: annotationId }, body, session] = await Promise.all([
    params,
    request.json(),
    auth(),
  ]);

  const { messages, modelId } = body;

  if (!session || !session.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Parallelize all independent DB reads upfront
  const [annotation, currentUser] = await Promise.all([
    getAnnotationById(annotationId),
    getUserByEmail(session.user.email!),
  ]);

  if (!annotation) {
    return new Response("Annotation not found", { status: 404 });
  }
  if (!currentUser) {
    return new Response("User not found", { status: 401 });
  }

  const chatId = (annotation as any).chatId.toString();
  const messageId = (annotation as any).messageId.toString();
  const selectedText = (annotation as any).selectedText;
  const userId = (currentUser as any)._id.toString();

  // Usage check
  const usageCheck = await checkUsageLimit(
    userId,
    currentUser.isPro || false,
    currentUser.currentPeriodStart,
    currentUser.currentPeriodEnd,
  );

  if (!usageCheck.allowed) {
    return Response.json({
        error: "usage_limit_exceeded",
        message: "You have reached your monthly usage limit"
    }, { status: 429 });
  }

  // Fire-and-forget: Persist user message (don't block streaming)
  const userMsg = messages.filter((m: any) => m.role === 'user' && m.content).pop();
  if (userMsg) {
    createMessage({
      chatId,
      senderId: userId,
      parentMsgId: annotationId,
      body: userMsg.content,
    }).catch(err => console.error("[Annotation API] User message persist error:", err));
  }

  // --- Context Construction (parallelized) ---
  // Fetch chat doc + parent message in parallel
  const [chatDoc, parentDbMsg] = await Promise.all([
    getChatById({ id: chatId }),
    DbMessage.findById(messageId).lean(),
  ]);

  let additionalContextGoogle: any[] = [];
  let aiIdString = "";

  if (chatDoc) {
    aiIdString = (chatDoc as any).aiId?.toString() || "";

    if (parentDbMsg && !Array.isArray(parentDbMsg)) {
        const toGoogle = (m: any) => ({
           role: m.senderId.toString() === aiIdString ? "model" : "user",
           parts: [{ text: m.body }]
        });
        
        additionalContextGoogle = [toGoogle(parentDbMsg)];
    }
  }

  const threadMessagesGoogle = messages
     .filter((m: any) => m.role !== 'system' && m.content)
     .map((m: any) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
     }));

  const fullGoogleContext = [...additionalContextGoogle, ...threadMessagesGoogle];

  const systemInstruction = `${appConfig.getModelIdentity()}
    Today's date is ${new Date().toLocaleDateString()}.

    The user has selected the following text from the parent message and is asking about it:
    "${selectedText}"

    IMPORTANT INSTRUCTIONS:
    - Keep responses SHORT and CONCISE (2-4 sentences max for simple questions)
    - Get straight to the point - no unnecessary preamble
    - Use bullet points for lists instead of paragraphs
    - Only elaborate if the user explicitly asks for more detail
    - Focus specifically on the selected text and the user's question`;

  try {
     const streamingResponse = await googleClient.models.generateContentStream({
        model: modelId || DEFAULT_MODEL_ID,
        contents: fullGoogleContext,
        config: {
          systemInstruction,
          tools: [{ googleSearch: {} }],
        }
     });

     const stream = new ReadableStream({
        async start(controller) {
           const encoder = new TextEncoder();
           let fullResponseText = "";
           let lastGroundingMetadata: any = null;
           let streamClosed = false;
           
           try {
              for await (const chunk of streamingResponse) {
                 if (streamClosed) break;
                 const text = chunk.text;
                 if (text) {
                    fullResponseText += text;
                    controller.enqueue(encoder.encode(`0:${text}\n`));
                 }
                 const gm = (chunk as any).candidates?.[0]?.groundingMetadata;
                 if (gm) lastGroundingMetadata = gm;
              }
              
              // Send grounding metadata if present
              if (!streamClosed && lastGroundingMetadata) {
                 controller.enqueue(encoder.encode(`2:${JSON.stringify(lastGroundingMetadata)}\n`));
              }

              // Close the stream as soon as text generation is complete
              if (!streamClosed) { controller.close(); streamClosed = true; }
              
              // Fire-and-forget: Persist AI response
              if (fullResponseText && aiIdString) {
                 createMessage({
                    chatId,
                    senderId: aiIdString,
                    parentMsgId: annotationId,
                    body: fullResponseText
                 }).catch(err => console.error("[Annotation API] AI message persist error:", err));
              }
           } catch(err) {
              console.error("[Annotation API] Streaming error:", err);
              if (!streamClosed) { try { controller.error(err); } catch {} streamClosed = true; }
           }
        }
     });

     return new Response(stream, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
  } catch (error) {
     console.error("[Annotation API] Generation error:", error);
     return new Response("Internal Server Error", { status: 500 });
  }
}
