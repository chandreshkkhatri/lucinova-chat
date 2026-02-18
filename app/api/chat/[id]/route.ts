import { Message, generateId } from "@/lib/chat-utils";

import { auth } from "@/app/(auth)/auth";
import { getChatById, getMessages, getUserByEmail } from "@/db/queries";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.email) {
    return new Response("Unauthorized", { status: 401 });
  }

  const currentUser = await getUserByEmail(session.user.email);
  if (!currentUser) {
    return new Response("User not found", { status: 401 });
  }

  const userId = (currentUser as any)._id.toString();
  const chat = await getChatById({ id });

  if (!chat || (chat as any).userId.toString() !== userId) {
    return new Response("Not found", { status: 404 });
  }

  const rawMessages = await getMessages(id);

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

  return Response.json({ messages: uiMessages });
}
