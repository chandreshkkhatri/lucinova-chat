import { generateId, Message } from "ai";
import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";

import { auth } from "@/app/(auth)/auth";
import { Chat as PreviewChat } from "@/components/custom/chat";
import { getChatById, getMessages, getUserByEmail } from "@/db/queries";

// Cache the database calls to prevent duplicate fetching in generateMetadata and Page
const getCachedChatById = cache(getChatById);
const getCachedMessages = cache(getMessages);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  if (!id || id === "undefined" || id === "null") {
    return {
      title: "Chat Not Found",
      description: "The requested chat conversation could not be found.",
    };
  }

  try {
    const chatFromDb = await getCachedChatById({ id });

    if (!chatFromDb) {
      return {
        title: "Chat Not Found",
        description: "The requested chat conversation could not be found.",
      };
    }

    // Use chat title if available, otherwise fetch first message
    let title = chatFromDb.title;

    if (!title || title === "New Chat") {
      const messages = await getCachedMessages(id);
      const firstMessage = messages[0]?.body || "";
      const truncatedMessage =
        firstMessage.length > 100
          ? firstMessage.substring(0, 100) + "..."
          : firstMessage;
      title = truncatedMessage || "AI Assistant";
    }

    return {
      title: `Lucidity - ${title}`,
      description: `Continue your conversation: ${title}`,
      robots: {
        index: false, // Don't index private chat conversations
        follow: false,
      },
    };
  } catch (error) {
    return {
      title: "Chat Conversation",
      description: "Continue your conversation with our AI assistant.",
      robots: {
        index: false,
        follow: false,
      },
    };
  }
}

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Check if id is valid before making database call
  if (!id || id === "undefined" || id === "null") {
    redirect("/");
  }

  const chatFromDb = await getCachedChatById({ id });

  if (!chatFromDb) redirect("/");

  // verify access
  const session = await auth();

  if (!session?.user) {
    notFound();
  }

  // Get the actual user document to ensure we have the MongoDB ObjectId
  const user = await getUserByEmail(session.user.email!);
  if (!user) {
    notFound();
  }

  const userId = (user as any)._id.toString();

  if (userId !== (chatFromDb as any).userId.toString()) {
    notFound();
  }

  // fetch top-level messages from DB and map to UI-friendly format
  const rawMessages = await getCachedMessages(id);
  const uiMessages: Message[] = rawMessages.map((msg: any) => {
    const role: "user" | "assistant" =
      msg.senderId.toString() === userId ? "user" : "assistant";

    // Convert DB files back to AI SDK attachment format
    const attachments = (msg.files || []).map((f: any) => ({
      name: f.name,
      url: f.url,
      contentType: f.mime,
    }));

    // Build parts array (SDK v6 format)
    const parts: any[] = [];
    if (msg.body) {
      parts.push({ type: "text", text: msg.body });
    }
    // Add file parts for attachments
    for (const attachment of attachments) {
      if (attachment.contentType?.startsWith("image/")) {
        parts.push({
          type: "file",
          file: { url: attachment.url, mediaType: attachment.contentType },
        });
      }
    }

    return {
      id: msg._id?.toString() || generateId(),
      role,
      content: msg.body || "",
      parts,
      ...(attachments.length > 0 && { experimental_attachments: attachments }),
    };
  }) as Message[];
  const isThread = false;

  return (
    <PreviewChat
      id={id}
      initialMessages={uiMessages}
      isThread={isThread}
      mainChatId={id}
      isUserPro={!!(user as any).isPro}
    />
  );
}
