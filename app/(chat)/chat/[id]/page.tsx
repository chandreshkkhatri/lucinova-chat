import { generateId, Message } from "ai";
import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/app/(auth)/auth";
import { Chat as PreviewChat } from "@/components/custom/chat";
import { getChatById, getMessages, getUserByEmail } from "@/db/queries";

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
    const chatFromDb = await getChatById({ id });

    if (!chatFromDb) {
      return {
        title: "Chat Not Found",
        description: "The requested chat conversation could not be found.",
      };
    }

    const messages = await getMessages(id);
    const firstMessage = messages[0]?.body || "";
    const truncatedMessage =
      firstMessage.length > 100
        ? firstMessage.substring(0, 100) + "..."
        : firstMessage;

    return {
      title: `Chat Conversation - ${truncatedMessage || "AI Assistant"}`,
      description: `Continue your conversation with our AI assistant. ${
        truncatedMessage ||
        "Get intelligent responses and boost your productivity."
      }`,
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

  const chatFromDb = await getChatById({ id });

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
  const rawMessages = await getMessages(id);
  const uiMessages: Message[] = rawMessages.map((msg: any) => {
    const role: "user" | "assistant" =
      msg.senderId.toString() === userId ? "user" : "assistant";
    return {
      id: msg._id?.toString() || generateId(),
      role,
      content: msg.body,
    };
  });
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
