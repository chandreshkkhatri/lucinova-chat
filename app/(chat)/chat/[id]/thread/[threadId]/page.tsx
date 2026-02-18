import { Message, generateId } from "@/lib/chat-utils";
import { notFound } from "next/navigation";

import { auth } from "@/app/(auth)/auth";
import { Chat as PreviewChat } from "@/components/custom/chat";
import { getChatById } from "@/db/queries";

export default async function ThreadPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; threadId: string }>;
  searchParams: Promise<{ parentMessageId?: string }>;
}) {
  const { id: mainChatId, threadId } = await params;
  const { parentMessageId } = await searchParams;

  const session = await auth();

  if (!session || !session.user) {
    return notFound();
  }

  // First check if the main chat exists and user has access
  const mainChat = await getChatById({ id: mainChatId });

  // Extract the actual ID string from the user object
  const userId =
    typeof session.user.id === "object"
      ? (session.user.id as any).id
      : session.user.id;

  if (!mainChat || userId !== (mainChat as any).userId.toString()) {
    return notFound();
  }

  // Try to get existing thread or create new one
  let threadChat = await getChatById({ id: threadId });

  // If thread doesn't exist and we have parentMessageId, this is a new thread
  if (!threadChat && parentMessageId) {
    threadChat = {
      id: threadId,
      messages: [],
      userId: userId,
      parentMessageId,
      isThread: true,
      mainChatId,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any;
  }

  if (!threadChat) {
    return notFound();
  }

  const threadData = threadChat as any;

  // Map DB messages to UI format
  const uiMessages: Message[] = (threadData.messages || []).map((msg: any) => {
    const role: "user" | "assistant" =
      msg.senderId?.toString() === userId ? "user" : "assistant";

    // Build parts array (SDK v6 format)
    const parts: any[] = [];
    if (msg.body) {
      parts.push({ type: "text", text: msg.body });
    }

    return {
      id: msg._id?.toString() || generateId(),
      role,
      content: msg.body || "",
      parts,
    };
  }) as Message[];

  return (
    <PreviewChat
      id={threadId}
      initialMessages={uiMessages}
      isThread={true}
      parentMessageId={parentMessageId || threadData.parentMessageId}
      mainChatId={mainChatId}
    />
  );
}
