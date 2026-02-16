import "server-only";
import { ensureConnection } from "./connection";
import { User, Chat, Message, Payment, Annotation, Usage, Project } from "./models";

// Re-export types for external use
export { Chat } from "./models";

/**
 * Check if user's subscription has expired and update their status if so.
 * Returns true if the user was updated.
 */
async function checkAndExpireSubscription(userDoc: any): Promise<boolean> {
  const now = new Date();
  const currentPeriodEnd = userDoc.currentPeriodEnd;

  if (!currentPeriodEnd || currentPeriodEnd.getTime() >= now.getTime()) {
    return false;
  }

  let shouldUpdate = false;

  if (userDoc.isPro) {
    userDoc.isPro = false;
    shouldUpdate = true;
  }
  if (userDoc.plan === "pro") {
    userDoc.plan = "free";
    shouldUpdate = true;
  }
  if (userDoc.subscriptionStatus === "active") {
    userDoc.subscriptionStatus = "inactive";
    shouldUpdate = true;
  }
  if (userDoc.currentPeriodEnd !== null) {
    userDoc.currentPeriodEnd = null;
    shouldUpdate = true;
  }

  if (shouldUpdate) {
    await userDoc.save();
  }

  return shouldUpdate;
}

// User functions
export async function createUser(
  email: string,
  password?: string,
  displayName?: string,
  avatarUrl?: string,
  isBot = false,
  oauthProvider?: "google" | null,
  oauthProviderId?: string,
  termsAcceptedAt?: Date,
) {
  await ensureConnection();
  // Use email prefix as displayName if not provided
  const normalizedEmail = String(email).trim().toLowerCase();
  const finalDisplayName = displayName || normalizedEmail.split("@")[0];

  // Check if user qualifies for Early Bird badge (first 500 non-bot users)
  const badges = [];
  if (!isBot) {
    const nonBotUserCount = await User.countDocuments({ isBot: false });
    if (nonBotUserCount < 500) {
      const userRank = nonBotUserCount + 1;
      badges.push({
        badgeId: "early-bird",
        earnedAt: new Date(),
        metadata: {
          userRank,
          benefitUsedMonths: 0,
        },
      });
      console.log(
        `[Badges] Awarded Early Bird badge to ${normalizedEmail} (rank #${userRank}/500)`
      );
    }
  }

  return User.create({
    email: normalizedEmail,
    password,
    displayName: finalDisplayName,
    avatarUrl,
    isBot,
    oauthProvider,
    oauthProviderId,
    termsAcceptedAt,
    badges,
  });
}

export async function getUserById(id: string) {
  await ensureConnection();
  const userDoc = await User.findById(id);
  if (!userDoc) {
    return null;
  }

  await checkAndExpireSubscription(userDoc);
  return userDoc.toObject();
}

export async function getUserByEmail(email: string) {
  await ensureConnection();
  const normalizedEmail = String(email).trim().toLowerCase();
  const userDoc = await User.findOne({ email: normalizedEmail });
  if (!userDoc) {
    return null;
  }

  await checkAndExpireSubscription(userDoc);
  return userDoc.toObject();
}

// Badge helpers
export async function getUserBadges(userId: string) {
  await ensureConnection();
  const user = await User.findById(userId).select("badges").lean() as any;
  return user?.badges || [];
}

export async function hasBadge(
  userId: string,
  badgeId: string
): Promise<boolean> {
  await ensureConnection();
  const user = await User.findById(userId).select("badges").lean() as any;
  return user?.badges?.some((b: any) => b.badgeId === badgeId) || false;
}

export async function hasActiveBadgeBenefit(
  userId: string,
  badgeId: string,
  durationMonths: number = 3
): Promise<boolean> {
  await ensureConnection();
  const user = await User.findById(userId).select("badges").lean() as any;
  const badge = user?.badges?.find((b: any) => b.badgeId === badgeId);
  if (!badge) return false;
  const benefitUsedMonths = badge.metadata?.benefitUsedMonths || 0;
  return benefitUsedMonths < durationMonths;
}

export async function incrementBadgeBenefitUsage(
  email: string,
  badgeId: string
): Promise<void> {
  await ensureConnection();
  const normalizedEmail = String(email).trim().toLowerCase();
  await User.updateOne(
    { email: normalizedEmail, "badges.badgeId": badgeId },
    { $inc: { "badges.$.metadata.benefitUsedMonths": 1 } }
  );
}

// Subscription helpers
export async function activateProSubscriptionByEmail(
  email: string,
  periodInDays = 30,
  provider: "razorpay" | "manual" = "razorpay",
) {
  await ensureConnection();
  // Normalize email and check if user exists
  const normalizedEmail = String(email).trim().toLowerCase();
  const existingUser = await User.findOne({ email: normalizedEmail }).lean();
  if (!existingUser || Array.isArray(existingUser)) {
    console.error("User not found for email:", email);
    return null;
  }

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  let currentPeriodStart: Date;
  let currentPeriodEnd: Date;
  let proSince: Date;

  // Check if user already has an active subscription
  const hasActiveSub =
    (existingUser as any).isPro &&
    (existingUser as any).currentPeriodEnd &&
    new Date((existingUser as any).currentPeriodEnd).getTime() > now.getTime();

  if (hasActiveSub) {
    // Extend from existing end date (renewal)
    // New period starts where the old one ends
    currentPeriodStart = new Date((existingUser as any).currentPeriodEnd!);
    currentPeriodEnd = new Date(currentPeriodStart);
    currentPeriodEnd.setDate(currentPeriodEnd.getDate() + periodInDays);
    proSince = (existingUser as any).proSince || now;
  } else {
    // New subscription - start from today
    currentPeriodStart = new Date(now);
    currentPeriodEnd = new Date(now);
    currentPeriodEnd.setDate(currentPeriodEnd.getDate() + periodInDays);
    proSince = (existingUser as any).proSince || now;
  }

  const update = {
    plan: "pro" as const,
    isPro: true,
    proSince,
    currentPeriodStart,
    currentPeriodEnd,
    subscriptionProvider: provider,
    subscriptionStatus: "active" as const,
  };

  const user = await User.findOneAndUpdate({ email: normalizedEmail }, update, {
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
  provider,
  subscriptionId,
  paymentId,
  taxAmount,
  taxRate,
  taxJurisdiction,
  raw,
}: {
  orderId: string;
  status: string;
  amount: number;
  currency?: string;
  customerEmail?: string;
  customerName?: string;
  environment?: "production" | "test";
  planName?: string;
  provider?: "razorpay";
  subscriptionId?: string;
  paymentId?: string;
  taxAmount?: number;
  taxRate?: number;
  taxJurisdiction?: string;
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
        provider,
        subscriptionId,
        paymentId,
        taxAmount,
        taxRate,
        taxJurisdiction,
        raw,
      },
    },
    { upsert: true, new: true },
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

export async function getPaymentByOrderId(orderId: string) {
  await ensureConnection();
  return Payment.findOne({ orderId }).lean();
}

// Chat functions
export async function createChat(
  userId: string,
  aiId: string,
  title?: string,
  chatId?: string,
  projectId?: string,
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

  if (projectId) {
    chatData.projectId = projectId;
  }

  const chat = await Chat.create(chatData);
  return chat.toObject();
}
export async function getChatsByUserId(userId: string) {
  await ensureConnection();
  const chats = await Chat.find({ userId })
    .sort({ lastMsgAt: -1 })
    .limit(100) // Limit to 100 recent chats for performance
    .lean();

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
export async function deleteThreadMessages(parentMsgId: string) {
  await ensureConnection();
  return Message.deleteMany({ parentMsgId });
}

// Annotation functions (Ask Lucinova threads)
export async function createAnnotation({
  messageId,
  chatId,
  userId,
  selectedText,
  startOffset,
  endOffset,
}: {
  messageId: string;
  chatId: string;
  userId: string;
  selectedText: string;
  startOffset?: number;
  endOffset?: number;
}) {
  await ensureConnection();
  const annotation = await Annotation.create({
    messageId,
    chatId,
    userId,
    selectedText,
    startOffset,
    endOffset,
  });
  return annotation.toObject();
}

export async function getAnnotationsByMessageId(messageId: string) {
  await ensureConnection();
  return Annotation.find({ messageId }).sort({ createdAt: 1 }).lean();
}

export async function getAnnotationsByChatId(chatId: string) {
  await ensureConnection();
  return Annotation.find({ chatId }).sort({ createdAt: 1 }).lean();
}

export async function getAnnotationById(id: string) {
  await ensureConnection();
  const annotation = await Annotation.findById(id).lean();
  if (annotation && !Array.isArray(annotation)) {
    return { ...annotation, id: (annotation as any)._id.toString() };
  }
  return annotation;
}

export async function deleteAnnotation(id: string) {
  await ensureConnection();
  // Delete all messages in this annotation thread first
  await Message.deleteMany({ parentMsgId: id });
  // Then delete the annotation itself
  return Annotation.findByIdAndDelete(id);
}

export async function getAnnotationThreadMessages(annotationId: string) {
  await ensureConnection();
  return Message.find({ parentMsgId: annotationId })
    .sort({ createdAt: 1 })
    .lean();
}

export async function getAnnotationThreadCount(annotationId: string) {
  await ensureConnection();
  return Message.countDocuments({ parentMsgId: annotationId });
}

// Password reset functions
export async function setPasswordResetToken(
  email: string,
  token: string,
  expiryDate: Date,
) {
  await ensureConnection();
  return User.findOneAndUpdate(
    { email },
    { resetToken: token, resetTokenExpiry: expiryDate },
    { new: true },
  ).lean();
}

export async function getUserByResetToken(token: string) {
  await ensureConnection();
  return User.findOne({
    resetToken: token,
    resetTokenExpiry: { $gt: new Date() },
  }).lean();
}

export async function updatePassword(email: string, hashedPassword: string) {
  await ensureConnection();
  return User.findOneAndUpdate(
    { email },
    {
      password: hashedPassword,
      resetToken: undefined,
      resetTokenExpiry: undefined,
    },
    { new: true },
  ).lean();
}

// Usage tracking functions
export async function getOrCreateCurrentUsage(
  userId: string,
  currentPeriodStart?: Date | null,
  currentPeriodEnd?: Date | null
) {
  await ensureConnection();

  const now = new Date();

  // Calculate period boundaries
  let periodStart: Date;
  let periodEnd: Date;

  if (
    currentPeriodStart &&
    currentPeriodEnd &&
    new Date(currentPeriodEnd) > now &&
    new Date(currentPeriodStart) <= now
  ) {
    // Pro user: Use actual subscription period boundaries
    periodStart = new Date(currentPeriodStart);
    periodEnd = new Date(currentPeriodEnd);
  } else {
    // Free user: Use calendar month
    periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  }

  // Find or create usage record for this exact period atomically
  const usage = await Usage.findOneAndUpdate(
    {
      userId,
      periodStart,
      periodEnd,
    },
    {
      $setOnInsert: {
        userId,
        periodStart,
        periodEnd,
        unitsUsed: 0,
        breakdown: [],
      },
    },
    {
      new: true,
      upsert: true,
    }
  );

  return usage.toObject();
}

export async function incrementUsage(
  userId: string,
  modelId: string,
  inputTokens: number,
  outputTokens: number,
  units: number,
  currentPeriodStart?: Date | null,
  currentPeriodEnd?: Date | null
) {
  await ensureConnection();

  const now = new Date();

  // Calculate period boundaries (keep in sync with getOrCreateCurrentUsage)
  let periodStart: Date;
  let periodEnd: Date;

  if (
    currentPeriodStart &&
    currentPeriodEnd &&
    new Date(currentPeriodEnd) > now &&
    new Date(currentPeriodStart) <= now
  ) {
    // Pro user: Use actual subscription period boundaries
    periodStart = new Date(currentPeriodStart);
    periodEnd = new Date(currentPeriodEnd);
  } else {
    // Free user: Use calendar month
    periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  }

  // Atomically find (or create) and update the current period's usage
  const updatedUsage = await Usage.findOneAndUpdate(
    {
      userId,
      periodStart,
      periodEnd,
    },
    {
      $inc: { unitsUsed: units },
      $set: { lastUpdated: now },
      $push: {
        breakdown: {
          modelId,
          inputTokens,
          outputTokens,
          unitsUsed: units,
          timestamp: now,
        },
      },
      $setOnInsert: {
        userId,
        periodStart,
        periodEnd,
      },
    },
    {
      upsert: true,
      new: true,
    }
  );

  if (!updatedUsage) {
    throw new Error("Failed to increment usage for user");
  }
}

export async function getUserUsageStats(
  userId: string,
  currentPeriodStart?: Date | null,
  currentPeriodEnd?: Date | null
) {
  await ensureConnection();

  const usage = await getOrCreateCurrentUsage(
    userId,
    currentPeriodStart,
    currentPeriodEnd
  );

  return {
    unitsUsed: typeof usage?.unitsUsed === "number" ? usage.unitsUsed : 0,
    periodStart: usage?.periodStart ?? null,
    periodEnd: usage?.periodEnd ?? null,
  };
}

export async function getUsageHistory(userId: string, limit = 12) {
  await ensureConnection();

  return Usage.find({ userId }).sort({ periodStart: -1 }).limit(limit).lean();
}

// Project functions
export async function createProject(
  userId: string,
  name: string,
  color?: string
) {
  await ensureConnection();
  const project = await Project.create({ userId, name, color });
  return { ...project.toObject(), id: project._id.toString() };
}

export async function getProjectsByUserId(userId: string) {
  await ensureConnection();
  const projects = await Project.find({ userId })
    .sort({ createdAt: -1 })
    .lean();
  return projects.map((p: any) => ({ ...p, id: p._id.toString() }));
}

export async function getProjectById(projectId: string) {
  await ensureConnection();
  const project = await Project.findById(projectId).lean();
  if (project && !Array.isArray(project)) {
    return { ...project, id: (project as any)._id.toString() };
  }
  return project;
}

export async function updateProject(
  projectId: string,
  updates: { name?: string; color?: string }
) {
  await ensureConnection();
  const project = await Project.findByIdAndUpdate(projectId, updates, {
    new: true,
  }).lean();
  if (project && !Array.isArray(project)) {
    return { ...project, id: (project as any)._id.toString() };
  }
  return project;
}

export async function deleteProject(projectId: string) {
  await ensureConnection();
  // Unlink all chats from this project
  await Chat.updateMany(
    { projectId },
    { $set: { projectId: null } }
  );
  return await Project.findByIdAndDelete(projectId);
}

export async function updateChatProject(
  chatId: string,
  projectId: string | null
) {
  await ensureConnection();
  const chat = await Chat.findByIdAndUpdate(
    chatId,
    { projectId },
    { new: true }
  ).lean();
  if (!chat || Array.isArray(chat)) return null;
  return { ...chat, id: (chat as any)._id.toString() };
}

export async function getChatsByProject(userId: string, projectId: string) {
  await ensureConnection();
  const chats = await Chat.find({ userId, projectId })
    .sort({ lastMsgAt: -1 })
    .lean();
  return chats.map((chat: any) => ({ ...chat, id: chat._id.toString() }));
}

/**
 * Get summaries from sibling chats in the same project.
 * Used for project memory injection into system prompts.
 */
export async function getProjectChatSummaries(
  projectId: string,
  excludeChatId: string,
  limit = 5,
) {
  await ensureConnection();
  const chats = await Chat.find({
    projectId,
    _id: { $ne: excludeChatId },
    summary: { $exists: true, $nin: [null, ""] },
  })
    .sort({ lastMsgAt: -1 })
    .limit(limit)
    .select("title summary lastMsgAt")
    .lean();

  return chats.map((chat: any) => ({
    id: chat._id.toString(),
    title: chat.title || "Untitled",
    summary: chat.summary,
    lastMsgAt: chat.lastMsgAt,
  }));
}
