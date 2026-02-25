import { googleModels } from "@/ai";
import { auth } from "@/app/(auth)/auth";
import { ensureConnection } from "@/db/connection";
import { Chat } from "@/db/models";
import { getMessages } from "@/db/queries";
import { generateSimpleText } from "@/lib/ai-utils";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json("Unauthorized", { status: 401 });
    }

    const { chatId } = await request.json();
    if (!chatId) {
      return Response.json("Missing chatId", { status: 400 });
    }

    await ensureConnection();

    // Verify chat belongs to user
    const chat = await Chat.findOne({ _id: chatId, userId: session.user.id });
    if (!chat) {
      return Response.json("Chat not found", { status: 404 });
    }

    // Fetch messages to generate title from
    const messages = await getMessages(chatId, 5); // Just need the first few
    if (!messages || messages.length === 0) {
      return Response.json("No messages found to generate title", { status: 400 });
    }

    // Usually the title is based on the first user message and first AI response
    const firstUserMsg = messages.find((m: any) => m.senderId.toString() === session.user?.id);
    const firstAIMsg = messages.find((m: any) => m.senderId.toString() !== session.user?.id);

    if (!firstUserMsg) {
       return Response.json("No user messages found", { status: 400 });
    }

    const aiResponseText = firstAIMsg ? firstAIMsg.body : "";

    const analysis = await generateSimpleText(googleModels.fast,
      `Analyze this exchange and return exactly in this format: "Title: <5 words> | Category: <One of: Coding, Academic, Creative, Business, Data, General>"
       User: ${firstUserMsg.body}
       AI: ${aiResponseText}`
    );

    if (analysis) {
      const parts = analysis.split('|');
      const title = parts[0]?.replace('Title:', '').trim();
      const category = parts[1]?.replace('Category:', '').trim();

      const updates: any = {};
      if (title) updates.title = title;
      if (category) updates.category = category;

      if (Object.keys(updates).length > 0) {
        await Chat.findByIdAndUpdate(chatId, updates);
        return Response.json({ title: updates.title, category: updates.category });
      }
    }

    return Response.json("Failed to generate title", { status: 500 });
  } catch (error) {
    console.error("[Chat Title API] Error generating title:", error);
    return Response.json("Internal Server Error", { status: 500 });
  }
}
