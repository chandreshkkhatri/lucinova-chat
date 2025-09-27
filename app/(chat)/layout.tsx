import { auth } from "@/app/(auth)/auth";
import { EnhancedChatUI } from "@/components/custom/enhanced-chat-ui";
import { History } from "@/components/custom/history";
import { getUserByEmail } from "@/db/queries";

export default async function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const user = session?.user;
  let isPro = false;
  if (user?.email) {
    try {
      const dbUser: any = await getUserByEmail(user.email);
      isPro = !!dbUser?.isPro;
    } catch {}
  }

  return (
    <EnhancedChatUI>
      <div className="flex h-dvh pt-16">
        <History user={{ ...(session?.user as any), isPro }} />
        <main className="flex-1 flex flex-col min-w-0">{children}</main>
      </div>
    </EnhancedChatUI>
  );
}
