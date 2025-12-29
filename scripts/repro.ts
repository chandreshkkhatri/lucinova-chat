import * as dotenv from "dotenv";
import mongoose from "mongoose";

async function main() {
  dotenv.config({ path: ".env" });

  // Import the helper from the built route file location if we were running compiled,
  // but with tsx we are running TS source.
  // We need to use dynamic imports to handle potential issues.

  // We need to alias "@/..." paths. tsx handles this via tsconfig usually.
  // Ensure we can import from app/(chat)/api/chat/route.ts

  const { convertMessagesWithAttachments } =
    await import("../app/(chat)/api/chat/route");
  const { ensureConnection } = await import("../db/connection");
  const { User, Chat, Message } = await import("../db/models");
  const { createChat, createMessage, getMessages, createUser } =
    await import("../db/queries");

  await ensureConnection();
  console.log("Connected to DB");

  const email = "testuser_" + Date.now() + "@example.com";
  const user = await createUser(email, "password", "Test User");
  const userId = (user as any)._id.toString();
  console.log("Created user:", userId);

  const aiUser = await createUser(
    "ai_" + Date.now() + "@bot.local",
    undefined,
    "AI Bot",
    undefined,
    true,
  );
  const aiId = (aiUser as any)._id.toString();

  const chatId = new mongoose.Types.ObjectId().toString();
  await createChat(userId, aiId, "Test Chat", chatId);

  // MOCK PAYLOAD: This is what the client sends.
  const mockMessages: any[] = [
    {
      id: "msg_1",
      role: "user",
      content: "", // Empty content string!
      experimental_attachments: [],
      parts: [{ type: "text", text: "Hello, verify persistence." }],
    },
  ];

  console.log("Processing mock messages...");

  // 1. Run the actual conversion logic
  const coreMessages = await convertMessagesWithAttachments(mockMessages);
  console.log("Core Messages:", JSON.stringify(coreMessages, null, 2));

  // 2. Run the filtering logic EXACTLY as in route.ts
  const userMessages = coreMessages.filter(
    (m: any) => m.role === "user" && m.content,
  );
  const lastUserMsg = userMessages[userMessages.length - 1];

  const rawUserMessages = mockMessages.filter((m: any) => m.role === "user");
  const lastRawUserMsg = rawUserMessages[rawUserMessages.length - 1];

  console.log("Detection Results:");
  console.log("lastUserMsg:", lastUserMsg);
  console.log("lastRawUserMsg:", lastRawUserMsg);

  let bodyToSave = "";
  let filesToSave: any[] = [];

  // Strategy 1: Try to extract from Raw Message (preserves attachments)
  if (lastRawUserMsg) {
    console.log("Path 1: Inspecting Raw Message");
    const textContent = (lastRawUserMsg as any).content || "";
    const attachments = (lastRawUserMsg as any).experimental_attachments || [];

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
  if (!bodyToSave && filesToSave.length === 0 && lastUserMsg) {
    console.log("Path 2: Falling back to core message content extraction");
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
    console.log("Persisting message", {
      body: bodyToSave,
      filesCount: filesToSave.length,
    });
    const result = await createMessage({
      chatId: chatId,
      senderId: userId,
      body: bodyToSave || " ",
      files: filesToSave,
    });
    console.log("Message Created:", result._id);
  } else {
    console.log("WARNING: No content to save for user message");
  }

  // Verify
  const saved = await Message.findOne({ chatId });
  if (saved) {
    console.log("SUCCESS: Message persisted.", saved.body);
  } else {
    console.error("FAILURE: Message NOT persisted.");
  }

  // Cleanup
  await User.deleteMany({
    email: { $in: [email, "ai_" + Date.now() + "@bot.local"] },
  });
  await Chat.deleteMany({ userId });
  await Message.deleteMany({ chatId });

  process.exit(0);
}

main().catch(console.error);
