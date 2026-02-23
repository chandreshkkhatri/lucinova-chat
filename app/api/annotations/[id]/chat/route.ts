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
  const { id: annotationId } = await params;
  const { messages, modelId } = await request.json();

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

  const currentUser = await getUserByEmail(session.user.email!);
  if (!currentUser) {
    return new Response("User not found", { status: 401 });
  }

  const userId = (currentUser as any)._id.toString();

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

  // Persist User Message
  const userMsg = messages.filter((m: any) => m.role === 'user' && m.content).pop();
  if (userMsg) {
    await createMessage({
      chatId,
      senderId: userId,
      parentMsgId: annotationId,
      body: userMsg.content,
    });
  }

  // --- Context Construction ---
  const chatDoc = await getChatById({ id: chatId });
  let additionalContextGoogle: any[] = [];
  let aiIdString = "";

  if (chatDoc) {
    await ensureConnection();
    aiIdString = (chatDoc as any).aiId?.toString() || "";
    // For annotations, context is the parent message containing the annotation
    const parentDbMsg = await DbMessage.findById(messageId).lean();

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
              
               // Close the stream as soon as text generation is complete
               controller.close();
               
               // Run DB writes asynchronously so they don't block the stream
               if (fullResponseText && aiIdString) {
                  (async () => {
                     try {
                        // Mock usage
                        if (currentUser) {
                           // await recordUsage(...);
                        }

                        await createMessage({
                           chatId,
                           senderId: aiIdString,
                           parentMsgId: annotationId,
                           body: fullResponseText
                        });
                     } catch (dbErr) {
                        console.error("[Annotation API DB Write Error]:", dbErr);
                     }
                  })();
               }
            } catch(err) {
               console.error("[Annotation API] Streaming error:", err);
               controller.error(err);
            }
         }
      });

      return new Response(stream, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
  } catch (error) {
     console.error("[Annotation API] Generation error:", error);
     return new Response("Internal Server Error", { status: 500 });
  }
}
