import { auth } from "@/app/(auth)/auth";
import { getChatsByUserId } from "@/db/queries";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return Response.json("Unauthorized!", { status: 401 });
  }

  const chats = await getChatsByUserId(session.user.id);

  return Response.json(chats, {
    headers: {
      "Cache-Control": "private, max-age=10, stale-while-revalidate=30",
    },
  });
}
