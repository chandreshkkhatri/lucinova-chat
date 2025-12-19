import { auth } from "@/app/(auth)/auth";
import { EnhancedChatUI } from "@/components/custom/enhanced-chat-ui";
import { History } from "@/components/custom/history";

export default async function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <EnhancedChatUI>
      <div className="flex h-dvh pt-16">
        <History user={session?.user ? { ...(session.user as any) } : undefined} />
        <main className="flex-1 flex flex-col min-w-0">{children}</main>
      </div>
    </EnhancedChatUI>
  );
}
