import { auth } from "@/app/(auth)/auth";
import { getChatsByUserId, getUserByEmail } from "@/db/queries";

export async function GET() {
  const session = await auth();

  if (!session || !session.user) {
    return Response.json("Unauthorized!", { status: 401 });
  }

  // Get the actual user document to ensure we have the MongoDB ObjectId
  const user = await getUserByEmail(session.user.email!);
  if (!user) {
    return Response.json("User not found", { status: 401 });
  }

  const userId = (user as any)._id.toString();

  const chats = await getChatsByUserId(userId);
  return Response.json(chats);
}
