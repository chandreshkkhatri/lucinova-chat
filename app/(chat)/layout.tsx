import { auth } from "@/app/(auth)/auth";
import { ActivityBar } from "@/components/custom/activity-bar";
import { EnhancedChatUI } from "@/components/custom/enhanced-chat-ui";
import { GoogleSignupTracker } from "@/components/custom/google-signup-tracker";
import { SidebarProvider } from "@/components/custom/sidebar-context";
import { SidebarPanel } from "@/components/custom/sidebar-panel";
import { getUserByEmail } from "@/db/queries";

export default async function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Fetch user data for Google sign-up tracking
  let userData: { id: string; createdAt: string; oauthProvider: string | null } | null = null;
  if (session?.user?.email) {
    try {
      const dbUser: any = await getUserByEmail(session.user.email);
      if (dbUser) {
        userData = {
          id: dbUser._id?.toString() || session.user.id,
          createdAt: dbUser.createdAt?.toISOString() || new Date().toISOString(),
          oauthProvider: dbUser.oauthProvider || null,
        };
      }
    } catch {}
  }

  return (
    <EnhancedChatUI>
      <SidebarProvider>
        <div className="flex h-dvh pt-16">
          <ActivityBar />
          <SidebarPanel user={session?.user ? { ...(session.user as any) } : undefined} />
          <main className="flex-1 flex flex-col min-w-0">{children}</main>
        </div>
      </SidebarProvider>
      {userData && (
        <GoogleSignupTracker
          userId={userData.id}
          createdAt={userData.createdAt}
          oauthProvider={userData.oauthProvider}
        />
      )}
    </EnhancedChatUI>
  );
}
