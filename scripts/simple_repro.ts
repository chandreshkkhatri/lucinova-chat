import * as dotenv from "dotenv";
import mongoose from "mongoose";

async function main() {
  dotenv.config({ path: ".env" });

  // Minimal definitions to avoid importing server-only modules
  const MONGODB_URI = process.env.MONGODB_URI!;
  if (!MONGODB_URI) throw new Error("MONGODB_URI missing");

  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB via minimalist script");

  const messageSchema = new mongoose.Schema(
    {
      chatId: { type: mongoose.Schema.Types.ObjectId, required: true },
      senderId: { type: mongoose.Schema.Types.ObjectId, required: true },
      parentMsgId: { type: String, default: null },
      body: { type: String, required: true },
      files: [{ name: String, url: String, mime: String }],
      createdAt: { type: Date, default: Date.now },
    },
    { timestamps: true },
  );

  // Use existing model if defined, otherwise define it
  const Message =
    mongoose.models.Message || mongoose.model("Message", messageSchema);

  // Ids
  const chatId = new mongoose.Types.ObjectId();
  const senderId = new mongoose.Types.ObjectId();

  console.log("Creating message for Chat:", chatId.toString());

  try {
    const msg = await Message.create({
      chatId: chatId,
      senderId: senderId,
      body: "Test persistence " + Date.now(),
      files: [],
    });
    console.log("Message created successfully:", msg._id);

    // Read it back
    const readMsg = await Message.findById(msg._id);
    console.log("Read back:", !!readMsg, readMsg?.body);

    // Cleanup
    await Message.findByIdAndDelete(msg._id);
    console.log("Cleanup done");
  } catch (e) {
    console.error("Failed to create message:", e);
  }

  await mongoose.disconnect();
}

main().catch(console.error);
