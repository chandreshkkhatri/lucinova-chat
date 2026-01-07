import { auth } from "@/app/(auth)/auth";
import {
  getUserByEmail,
  getUserUsageStats,
  getUsageHistory,
} from "@/db/queries";
import { getUserLimit } from "@/lib/usage";

export async function GET() {
  const session = await auth();

  if (!session?.user?.email) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await getUserByEmail(session.user.email);
  if (!user) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  const userId = (user as any)._id.toString();
  const isPro = user.isPro || false;

  const stats = await getUserUsageStats(userId, user.currentPeriodEnd);
  const history = await getUsageHistory(userId, 6);
  const limit = getUserLimit(isPro);

  return Response.json({
    current: {
      unitsUsed: stats.unitsUsed,
      limit,
      remaining: Math.max(0, limit - stats.unitsUsed),
      percentUsed: Math.min(100, (stats.unitsUsed / limit) * 100),
      periodStart: stats.periodStart,
      periodEnd: stats.periodEnd,
    },
    history: history.map((h: any) => ({
      periodStart: h.periodStart,
      periodEnd: h.periodEnd,
      unitsUsed: h.unitsUsed,
    })),
    isPro,
    plan: user.plan || "free",
  });
}
