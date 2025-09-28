import "server-only";
import { ensureConnection } from "./connection";
import { User, Chat, Message, Payment } from "./models";

// Re-export types for external use
export { Chat } from "./models";

// User functions
export async function createUser(
  email: string,
  password?: string,
  displayName?: string,
  avatarUrl?: string,
  isBot = false
) {
  await ensureConnection();
  // Use email prefix as displayName if not provided
  const finalDisplayName = displayName || email.split("@")[0];
  return User.create({
    email,
    password,
    displayName: finalDisplayName,
    avatarUrl,
    isBot,
  });
}
export async function getUserByEmail(email: string) {
  await ensureConnection();
  return User.findOne({ email }).lean();
}

// Subscription helpers
export async function activateProSubscriptionByEmail(
  email: string,
  periodInDays = 30,
  provider: "cashfree" | "manual" = "cashfree"
) {
  await ensureConnection();
  const now = new Date();
  // Normalize plan start to start of today
  now.setHours(0, 0, 0, 0);

  // End date is periodInDays ahead
  const currentPeriodEnd = new Date(now);
  currentPeriodEnd.setDate(currentPeriodEnd.getDate() + periodInDays);
  const update = {
    plan: "pro" as const,
    isPro: true,
    proSince: now,
    currentPeriodEnd,
    subscriptionProvider: provider,
    subscriptionStatus: "active" as const,
  };
  const user = await User.findOneAndUpdate({ email }, update, {
    new: true,
  }).lean();
  return user;
}

export async function recordPaymentOnce({
  orderId,
  status,
  amount,
  currency = "INR",
  customerEmail,
  customerName,
  environment,
  planName,
  raw,
}: {
  orderId: string;
  status: string;
  amount: number;
  currency?: string;
  customerEmail?: string;
  customerName?: string;
  environment?: "production" | "sandbox";
  planName?: string;
  raw?: any;
}) {
  await ensureConnection();
  // Idempotent create-or-update by orderId
  const doc = await Payment.findOneAndUpdate(
    { orderId },
    {
      $setOnInsert: { orderId },
      $set: {
        status,
        amount,
        currency,
        customerEmail,
        customerName,
        environment,
        planName,
        raw,
      },
    },
    { upsert: true, new: true }
  ).lean();
  return doc;
}

export async function getPaymentsByEmail(email: string, limit = 50) {
  await ensureConnection();
  return Payment.find({ customerEmail: email })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
}

// Chat functions
export async function createChat(
  userId: string,
  aiId: string,
  title?: string,
  chatId?: string
) {
  await ensureConnection();
  const chatData: any = { userId, aiId };

  if (title) {
    chatData.title = title;
  }

  // Allow the caller to specify the _id so that the client-generated id and
  // the MongoDB document id stay in sync.
  if (chatId) {
    chatData._id = chatId;
  }

  const chat = await Chat.create(chatData);
  return chat.toObject();
}
export async function getChatsByUserId(userId: string) {
  await ensureConnection();
  const chats = await Chat.find({ userId }).sort({ lastMsgAt: -1 }).lean();

  // Ensure each chat has an `id` field (lean documents don\'t include the virtual by default)
  return chats.map((chat: any) => ({
    ...chat,
    id: chat._id.toString(),
  }));
}
export async function getChatById({ id }: { id: string }) {
  await ensureConnection();
  const chat = await Chat.findById(id).lean();
  if (chat && !Array.isArray(chat)) {
    return { ...chat, id: (chat as any)._id.toString() } as any;
  }
  return chat;
}

// Message functions
export async function createMessage({
  chatId,
  senderId,
  parentMsgId = null,
  body,
  files = [],
}: {
  chatId: string;
  senderId: string;
  parentMsgId?: string | null;
  body: string;
  files?: Array<{ name: string; url: string; mime: string }>;
}) {
  await ensureConnection();
  const message = await Message.create({
    chatId,
    senderId,
    parentMsgId,
    body,
    files,
  });
  await Chat.findByIdAndUpdate(chatId, { lastMsgAt: new Date() });
  return message.toObject();
}

export async function getMessages(chatId: string, limit = 50) {
  await ensureConnection();
  return Message.find({ chatId, parentMsgId: null })
    .sort({ createdAt: 1 })
    .limit(limit)
    .lean();
}

export async function getThreadMessages(parentMsgId: string) {
  await ensureConnection();
  return Message.find({ parentMsgId }).sort({ createdAt: 1 }).lean();
}

export async function getThreadCountByParentMessage({
  parentMessageId,
}: {
  parentMessageId: string;
}) {
  await ensureConnection();
  return Message.countDocuments({ parentMsgId: parentMessageId });
}
export async function getMessageById({ id }: { id: string }) {
  await ensureConnection();
  return Message.findById(id).lean();
}
export async function deleteChatById({ id }: { id: string }) {
  await ensureConnection();
  await Message.deleteMany({ chatId: id });
  return Chat.findByIdAndDelete(id);
}
