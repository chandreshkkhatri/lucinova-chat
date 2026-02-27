import { put } from "@vercel/blob";
import { type NextRequest } from "next/server";

import { googleClient, DEFAULT_MODEL_ID, googleModels, GEMINI_3_PRO_IMAGE_MODEL_ID, GEMINI_2_5_FLASH_IMAGE_MODEL_ID } from "@/ai";
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
import { checkUsageLimit } from "@/lib/usage-service";
import { generateSimpleText } from "@/lib/ai-utils";

// Local compatibility types
interface UIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  experimental_attachments?: Array<{
    name?: string;
    url: string;
    contentType?: string;
  }>;
}

// Configure runtime
export const maxDuration = 60; // 60 seconds

// Module-level cache for the AI bot user ID — fetched once, reused across requests
let cachedAiBotId: string | null = null;
async function getAiBotId(): Promise<string> {
  if (cachedAiBotId) return cachedAiBotId;
  let aiUser = await getUserByEmail("ai@assistant.local");
  if (!aiUser) {
    aiUser = await createUser("ai@assistant.local", undefined, "AI Assistant", undefined, true);
  }
  const id = (aiUser as any)._id.toString() as string;
  cachedAiBotId = id;
  return id;
}

/**
 * Convert messages to Google GenAI Content format.
 * Handles text and file/image attachments by converting to inlineData (base64).
 */
async function convertMessagesToGoogleContent(messages: UIMessage[]) {
  const contents = [];
  
  for (const m of messages) {
    if (m.role === 'system') continue; // Handled via systemInstruction

    const parts = [];
    
    // Add text content
    if (m.content) {
      parts.push({ text: m.content });
    }

    // Process attachments
    if (m.experimental_attachments && m.experimental_attachments.length > 0) {
      for (const att of m.experimental_attachments) {
        try {
          let base64Data = "";
          let mimeType = att.contentType || "application/octet-stream";

          if (att.url.startsWith("data:")) {
            // Extract base64 from data URL
            base64Data = att.url.split(",")[1];
            // Extract mime from data URL if needed, but att.contentType usually has it
          } else {
            // Fetch remote URL and convert to base64
            // Note: This relies on the server having access to the URL
            const res = await fetch(att.url);
            if (!res.ok) throw new Error(`Failed to fetch attachment: ${res.statusText}`);
            const arrayBuffer = await res.arrayBuffer();
            base64Data = Buffer.from(arrayBuffer).toString("base64");
          }

          parts.push({
            inlineData: {
              mimeType,
              data: base64Data
            }
          });
        } catch (error) {
          console.error(`[Chat API] Error processing attachment ${att.name}:`, error);
          // Skip failed attachments but continue
        }
      }
    }

    // Only add if there is content (text or parts)
    if (parts.length > 0) {
      contents.push({
        role: m.role === 'user' ? 'user' : 'model',
        parts
      });
    }
  }

  return contents;
}


async function generateAndSaveTitle(id: string, messages: any[], aiResponseText: string) {
  if (messages.length !== 1) return;
  try {
    const lastUserText = messages.filter(m => m.role === 'user').pop()?.content || "";
    
    // Truncate to maximum 800 chars to avoid feeding massive chunks of context (like code) into the title generator
    const truncatedUserText = lastUserText.length > 800 ? lastUserText.slice(0, 800) + "..." : lastUserText;
    const truncatedAiText = aiResponseText.length > 800 ? aiResponseText.slice(0, 800) + "..." : aiResponseText;

    const analysis = await generateSimpleText(googleModels.title,
      `Analyze this exchange and return exactly in this format: "Title: <5 words> | Category: <One of: Coding, Academic, Creative, Business, Data, General>"
       User: ${truncatedUserText}
       AI: ${truncatedAiText}`
    );

    if (analysis) {
      const parts = analysis.split('|');
      const title = parts[0]?.replace('Title:', '').trim();
      const category = parts[1]?.replace('Category:', '').trim();

      const updates: any = {};
      if (title) updates.title = title;
      if (category) updates.category = category;

      if (Object.keys(updates).length > 0) {
        await Chat.findByIdAndUpdate(id, updates);
      }
    }
  } catch (err) {
    console.error("[Chat API] generateAndSaveTitle failed:", err);
  }
}

export async function POST(req: NextRequest) {
  // Warm the DB connection once — all subsequent queries skip this check
  await ensureConnection();

  const {
    id,
    messages,
    modelId,
    projectId: requestProjectId,
  }: {
    id: string;
    messages: Array<UIMessage>;
    modelId?: string;
    projectId?: string;
  } = await req.json();

  const session = await auth();
  const isGuest = !session || !session.user;
  let userId: string | null = null;
  let currentUser: any = null;

  // --- Auth & Usage Check (parallelised where possible) ---
  if (!isGuest && session?.user?.email) {
    // Fetch user and existing chat in parallel — both are independent reads
    const [user, existingChat] = await Promise.all([
      getUserByEmail(session.user.email),
      getChatById({ id }),
    ]);

    if (!user) return new Response("User not found", { status: 401 });

    userId = (user as any)._id.toString();
    currentUser = user;

    // Usage check — needs user data but nothing else
    const usageCheck = await checkUsageLimit(
      userId!,
      user.isPro || false,
      user.currentPeriodStart,
      user.currentPeriodEnd
    );

    if (!usageCheck.allowed) {
      return Response.json({
        error: "usage_limit_exceeded",
        message: "You have reached your monthly usage limit",
        isPro: user.isPro || false,
        currentUsage: usageCheck.currentUsage,
        limit: usageCheck.limit,
        periodEnd: usageCheck.periodEnd,
      }, { status: 429 });
    }

    // --- Project validation + Chat creation (parallel where possible) ---
    let validatedProjectId: string | undefined;
    let chat: any = existingChat;

    if (requestProjectId) {
      try {
        const project = await getProjectById(requestProjectId);
        if (project && (project as any).userId.toString() === userId) {
          validatedProjectId = requestProjectId;
        }
      } catch {}
    }

    if (!chat) {
      const aiBotId = await getAiBotId();
      chat = await createChat(
        userId!,
        aiBotId,
        "New Chat",
        id,
        validatedProjectId
      );
    }

    // Fire-and-forget: Persist user message (don't block streaming)
    const lastUserMsg = messages.filter(m => m.role === 'user').pop();
    if (lastUserMsg) {
      const filesToSave = lastUserMsg.experimental_attachments?.map((a: any) => ({
        name: a.name || "file",
        url: a.url,
        mime: a.contentType || "application/octet-stream"
      })) || [];

      createMessage({
        chatId: id,
        senderId: userId!,
        body: lastUserMsg.content || (filesToSave.length ? "[Attachment]" : " "),
        files: filesToSave
      }).catch(err => console.error("[Chat API] User message persist error:", err));
    }

    // --- Build AI request while context loads in parallel ---
    const chatProjectId = validatedProjectId || chat?.projectId?.toString();

    // Start content conversion and project context retrieval in parallel
    const [googleContents, projectMemoryContext] = await Promise.all([
      convertMessagesToGoogleContent(messages),
      (async () => {
        if (!chatProjectId) return "";
        try {
          const summaries = await getProjectChatSummaries(chatProjectId, id, 5);
          if (summaries.length > 0) {
            const project = await getProjectById(chatProjectId);
            const projectName = (project as any)?.name || "this project";
            return `\n\nYou are working within the project "${projectName}". Previous context:\n` +
              summaries.map((c: any) => `[${c.title}]: ${c.summary}`).join("\n");
          }
        } catch {}
        return "";
      })(),
    ]);

    const targetModelId = modelId || DEFAULT_MODEL_ID;
    const systemInstruction = `${appConfig.getModelIdentity()} You can help with various tasks. Today is ${new Date().toLocaleDateString()}.${projectMemoryContext}`;

    // --- Image Model Path (non-streaming, uses generateContent) ---
    const isImageModel = targetModelId.includes('image');
    if (isImageModel) {
      const stream = new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();
          let streamClosed = false;
          try {
            const isProImage = targetModelId.includes(GEMINI_3_PRO_IMAGE_MODEL_ID);
            const imageConfig: any = {
              responseModalities: ['TEXT', 'IMAGE'],
            };

            const generateWithTimeout = async (modelIdToUse: string) => {
              const generationPromise = googleClient.models.generateContent({
                model: modelIdToUse,
                contents: googleContents,
                config: imageConfig,
              });

              generationPromise.catch(err => {
                 console.error(`[Chat API] Background generation promise for ${modelIdToUse} failed (likely native timeout/hang):`, err.message || err);
              });

              // 45 second timeout for image generation
              const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error("Image generation timed out")), 45000);
              });

              return Promise.race([generationPromise, timeoutPromise]);
            };

            let imageResponse: any;
            let actualModelUsed = targetModelId;
            try {
              imageResponse = await generateWithTimeout(targetModelId);
            } catch (initialErr) {
              console.warn(`[Chat API] Primary image model (${targetModelId}) failed/timed out. Falling back to flash. Error:`, initialErr);
              // Fallback to the reliable and fast flash model
              actualModelUsed = GEMINI_2_5_FLASH_IMAGE_MODEL_ID;
              imageResponse = await generateWithTimeout(actualModelUsed);
            }

            const modelDisplayName = appConfig.modelNames?.[actualModelUsed] || actualModelUsed;

            if (streamClosed) return;

            const parts = imageResponse.candidates?.[0]?.content?.parts || [];
            let fullResponseText = "";
            const imageFiles: Array<{ name: string; url: string; mime: string; modelName?: string }> = [];

            for (const part of parts) {
              if (part.text) {
                fullResponseText += part.text;
                controller.enqueue(encoder.encode(`0:${part.text}\n`));
              } else if (part.inlineData) {
                // Upload image to Vercel Blob for persistence
                const ext = part.inlineData.mimeType === 'image/png' ? 'png' : 'jpg';
                const filename = `generated-${Date.now()}-${imageFiles.length}.${ext}`;
                try {
                  const buffer = Buffer.from(part.inlineData.data!, 'base64');
                  const blob = await put(`chat-images/${filename}`, buffer, {
                    access: 'public',
                    contentType: part.inlineData.mimeType || 'image/png',
                  });
                  imageFiles.push({ name: filename, url: blob.url, mime: part.inlineData.mimeType || 'image/png', modelName: modelDisplayName });
                  // Send blob URL to client (persistent, smaller payload than base64)
                  controller.enqueue(encoder.encode(`1:${JSON.stringify({
                    mimeType: part.inlineData.mimeType,
                    url: blob.url,
                    modelName: modelDisplayName,
                  })}\n`));
                } catch (uploadErr) {
                  console.error("[Chat API] Blob upload error, falling back to base64:", uploadErr);
                  // Fallback: send base64 directly if blob upload fails
                  controller.enqueue(encoder.encode(`1:${JSON.stringify({
                    mimeType: part.inlineData.mimeType,
                    data: part.inlineData.data,
                  })}\n`));
                }
              }
            }

            // Send grounding metadata if present
            const gm = (imageResponse as any).candidates?.[0]?.groundingMetadata;
            if (gm && !streamClosed) {
              controller.enqueue(encoder.encode(`2:${JSON.stringify(gm)}\n`));
            }

            if (!streamClosed) {
              controller.close();
              streamClosed = true;
            }

            // Fire-and-forget: persist AI message with image file URLs
            if ((fullResponseText || imageFiles.length > 0) && chat) {
              createMessage({
                chatId: id,
                senderId: (chat as any).aiId,
                body: fullResponseText || "[Generated Image]",
                files: imageFiles,
                groundingMetadata: gm,
              }).catch(err => console.error("[Chat API] Image message persist error:", err));
              
              generateAndSaveTitle(id, messages, fullResponseText || "[Generated Image]").catch(console.error);
            }
          } catch (err) {
            console.error("[Chat API] Image generation error:", err);
            if (!streamClosed) {
              try { controller.error(err); } catch {}
              streamClosed = true;
            }
          }
        }
      });

      return new Response(stream, {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    // --- Text Model Path (streaming) ---
    const streamingResponse = await googleClient.models.generateContentStream({
      model: targetModelId,
      contents: googleContents,
      config: {
        systemInstruction,
        tools: [{ googleSearch: {} }],
      },
    });

    // Create ReadableStream for response
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
            // Capture grounding metadata (appears on the last chunk)
            const gm = (chunk as any).candidates?.[0]?.groundingMetadata;
            if (gm) lastGroundingMetadata = gm;
          }

          // Send grounding metadata if present
          if (!streamClosed && lastGroundingMetadata) {
            controller.enqueue(encoder.encode(`2:${JSON.stringify(lastGroundingMetadata)}\n`));
          }

          // Close the stream immediately so the client sees the response as complete
          if (!streamClosed) { controller.close(); streamClosed = true; }

          // --- Post-Generation Logic (fire-and-forget, non-blocking) ---
          if (fullResponseText && chat) {
            (async () => {
              try {
                await createMessage({
                  chatId: id,
                  senderId: (chat as any).aiId,
                  body: fullResponseText,
                  groundingMetadata: lastGroundingMetadata
                });

                await generateAndSaveTitle(id, messages, fullResponseText);
              } catch (postGenErr) {
                console.error("[Chat API] Post-generation error:", postGenErr);
              }
            })();
          }
        } catch (err) {
          console.error("[Chat API] Streaming error:", err);
          if (!streamClosed) { try { controller.error(err); } catch {} streamClosed = true; }
        }
      }
    });

    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  // --- Guest path (no DB ops, just stream) ---
  const googleContents = await convertMessagesToGoogleContent(messages);
  const targetModelId = modelId || DEFAULT_MODEL_ID;
  const systemInstruction = `${appConfig.getModelIdentity()} You can help with various tasks. Today is ${new Date().toLocaleDateString()}.`;

  // Image model path for guests (non-streaming)
  const isGuestImageModel = targetModelId.includes('image');
  if (isGuestImageModel) {
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        let streamClosed = false;
        try {
          const isProImage = targetModelId.includes(GEMINI_3_PRO_IMAGE_MODEL_ID);
          const imageConfig: any = {
            responseModalities: ['TEXT', 'IMAGE'],
          };

          const generateWithTimeout = async (modelIdToUse: string) => {
            const generationPromise = googleClient.models.generateContent({
              model: modelIdToUse,
              contents: googleContents,
              config: imageConfig,
            });

            generationPromise.catch(err => {
               console.error(`[Chat API] Guest background generation promise for ${modelIdToUse} failed:`, err.message || err);
            });

            // 45 second timeout for image generation
            const timeoutPromise = new Promise((_, reject) => {
              setTimeout(() => reject(new Error("Image generation timed out")), 45000);
            });

            return Promise.race([generationPromise, timeoutPromise]);
          };

          let imageResponse: any;
          let actualModelUsed = targetModelId;
          try {
            imageResponse = await generateWithTimeout(targetModelId);
          } catch (initialErr) {
            console.warn(`[Chat API] Guest primary image model (${targetModelId}) failed/timed out. Falling back to flash. Error:`, initialErr);
            // Fallback to the reliable and fast flash model
            actualModelUsed = GEMINI_2_5_FLASH_IMAGE_MODEL_ID;
            imageResponse = await generateWithTimeout(actualModelUsed);
          }

          const modelDisplayName = appConfig.modelNames?.[actualModelUsed] || actualModelUsed;

          if (streamClosed) return;

          const parts = imageResponse.candidates?.[0]?.content?.parts || [];
          console.log(`[Chat API] Guest Image Model Response parts count: ${parts.length}`);
          
          for (const part of parts) {
            if (part.text) {
              controller.enqueue(encoder.encode(`0:${part.text}\n`));
            } else if (part.inlineData) {
              controller.enqueue(encoder.encode(`1:${JSON.stringify({
                mimeType: part.inlineData.mimeType,
                data: part.inlineData.data,
                modelName: modelDisplayName,
              })}\n`));
            }
          }
          const gm = (imageResponse as any).candidates?.[0]?.groundingMetadata;
          if (gm && !streamClosed) {
            console.log("[Chat API] Guest Grounding metadata found in image response");
            controller.enqueue(encoder.encode(`2:${JSON.stringify(gm)}\n`));
          }
          if (!streamClosed) {
            controller.close();
            streamClosed = true;
          }
        } catch (err) {
          console.error("[Chat API] Guest image generation error:", err);
          if (!streamClosed) {
            try { controller.error(err); } catch {}
            streamClosed = true;
          }
        }
      }
    });

    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  // Text model path for guests (streaming)
  const streamingResponse = await googleClient.models.generateContentStream({
    model: targetModelId,
    contents: googleContents,
    config: {
      systemInstruction,
      tools: [{ googleSearch: {} }],
    },
  });

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      let lastGroundingMetadata: any = null;
      let streamClosed = false;
      try {
        for await (const chunk of streamingResponse) {
          if (streamClosed) break;
          const text = chunk.text;
          if (text) {
            controller.enqueue(encoder.encode(`0:${text}\n`));
          }
          const gm = (chunk as any).candidates?.[0]?.groundingMetadata;
          if (gm) lastGroundingMetadata = gm;
        }
        if (!streamClosed && lastGroundingMetadata) {
          controller.enqueue(encoder.encode(`2:${JSON.stringify(lastGroundingMetadata)}\n`));
        }
        if (!streamClosed) { controller.close(); streamClosed = true; }
      } catch (err) {
        console.error("[Chat API] Streaming error:", err);
        if (!streamClosed) { try { controller.error(err); } catch {} streamClosed = true; }
      }
    }
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

// Keep other handlers (PUT, PATCH, DELETE) as they are logic-independent of AI SDK
export async function PUT(request: Request) {
  const { id, title, isPinned } = await request.json();
  const session = await auth();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });
  await ensureConnection();
  const update: any = {};
  if (title !== undefined) update.title = title;
  if (isPinned !== undefined) update.isPinned = isPinned;
  await Chat.findByIdAndUpdate(id, update);
  return new Response("OK", { status: 200 });
}

export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) return new Response("Unauthorized", { status: 401 });
    const user = await getUserByEmail(session.user.email);
    if (!user) return new Response("User not found", { status: 401 });
    const userId = (user as any)._id.toString();
    const { id, projectId } = await request.json();
    const chat = await getChatById({ id });
    if (!chat || (chat as any).userId.toString() !== userId) return new Response("Unauthorized", { status: 401 });
    
    if (projectId) {
       const project = await getProjectById(projectId);
       if (!project || (project as any).userId.toString() !== userId) return new Response("Project not found", { status: 404 });
    }
    await updateChatProject(id, projectId || null);
    return new Response("OK", { status: 200 });
  } catch (e) { 
    return new Response("Error", { status: 500 }); 
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return new Response("Not Found", { status: 404 });
  const session = await auth();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });
  try {
     const chat = await getChatById({ id });
     if (!chat) return new Response("Chat not found", { status: 404 });
     const user = await getUserByEmail(session.user.email!);
     const userId = (user as any)._id.toString();
     if ((chat as any).userId.toString() !== userId) return new Response("Unauthorized", { status: 401 });
     await deleteChatById({ id });
     return new Response("Chat deleted", { status: 200 });
  } catch { return new Response("Error", { status: 500 }); }
}
