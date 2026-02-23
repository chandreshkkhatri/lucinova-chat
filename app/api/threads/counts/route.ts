import mongoose from "mongoose";

import { auth } from "@/app/(auth)/auth";
import { ensureConnection } from "@/db/connection";
import { Message, Chat } from "@/db/models";

/**
 * GET /api/threads/counts?chatId=XXX
 * Returns a map of { [messageId]: count } for all messages in a chat.
 * This is a batch endpoint that replaces N individual /api/threads/count calls.
 */
export async function GET(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;

  const { searchParams } = new URL(request.url);
  const chatId = searchParams.get("chatId");

  if (!chatId) {
    return Response.json({ error: "chatId is required" }, { status: 400 });
  }

  await ensureConnection();

  // Verify chat exists and matches user if not guest
  const query: any = { _id: chatId };
  if (userId && mongoose.Types.ObjectId.isValid(userId)) {
    query.userId = userId;
  }

  const chat = await Chat.findOne(query).select("_id userId");

  if (!chat) {
    return Response.json({ error: "Chat not found" }, { status: 404 });
  }

  // If chat has a userId but session doesn't match, 401
  if (chat.userId && chat.userId.toString() !== userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get all direct messages in this chat (parentMsgId: null = top-level messages)
  const topLevelMessages = await Message.find({ chatId, parentMsgId: null })
    .select("_id")
    .lean();

  const messageIds = topLevelMessages.map((m: any) => m._id.toString());

  if (messageIds.length === 0) {
    return Response.json(
      {},
      {
        headers: {
          "Cache-Control": "private, max-age=15, stale-while-revalidate=60",
        },
      }
    );
  }

  // Single aggregation query to count threads per message
  const counts = await Message.aggregate([
    {
      $match: {
        parentMsgId: { $in: messageIds },
      },
    },
    {
      $group: {
        _id: "$parentMsgId",
        count: { $sum: 1 },
      },
    },
  ]);

  // Build the result map
  const countMap: Record<string, number> = {};
  // Initialize all messages to 0
  for (const id of messageIds) {
    countMap[id] = 0;
  }
  // Fill in actual counts
  for (const entry of counts) {
    countMap[entry._id.toString()] = entry.count;
  }

  return Response.json(countMap, {
    headers: {
      "Cache-Control": "private, max-age=15, stale-while-revalidate=60",
    },
  });
}
