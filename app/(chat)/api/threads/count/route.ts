import { NextRequest } from "next/server";

import { auth } from "@/app/(auth)/auth";
import { getThreadCountByParentMessage, getChatById, getUserByEmail } from "@/db/queries";
import {
  createUnauthorizedResponse,
  createBadRequestResponse,
  createJsonResponse,
  createInternalErrorResponse,
} from "@/lib/api-responses";

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session || !session.user) {
    return createUnauthorizedResponse();
  }

  // Get the actual user document to ensure we have the MongoDB ObjectId
  const user = await getUserByEmail(session.user.email!);
  if (!user) {
    return createUnauthorizedResponse();
  }

  const userId = (user as any)._id.toString();

  const { searchParams } = new URL(request.url);
  const parentMessageId = searchParams.get("parentMessageId");
  const mainChatId = searchParams.get("mainChatId");

  if (!parentMessageId || !mainChatId) {
    return createBadRequestResponse("Missing required parameters");
  }

  try {
    // Verify user has access to the main chat
    const mainChat = await getChatById({ id: mainChatId });
    if (!mainChat || (mainChat as any).userId.toString() !== userId) {
      return createUnauthorizedResponse();
    }

    const threadCount = await getThreadCountByParentMessage({
      parentMessageId,
    });

    return createJsonResponse({ count: threadCount });
  } catch (error) {
    console.error("Failed to get thread count:", error);
    return createInternalErrorResponse();
  }
}
