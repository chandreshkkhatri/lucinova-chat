import { Metadata } from "next";

import { auth } from "@/app/(auth)/auth";
import { Chat } from "@/components/custom/chat";
import { getUserByEmail } from "@/db/queries";
import { generateUUID } from "@/lib/utils";

export const metadata: Metadata = {
  title: "AI Chat Assistant - Start Your Conversation",
  description:
    "Start a new conversation with our AI-powered chat assistant. Get intelligent responses, ask questions, and boost your productivity with advanced AI technology.",
  openGraph: {
    title: "AI Chat Assistant - Start Your Conversation",
    description:
      "Start a new conversation with our AI-powered chat assistant. Get intelligent responses and boost your productivity.",
    url: "https://delibration.vercel.app",
    images: [
      {
        url: "/og/default.png",
        width: 768,
        height: 480,
        alt: "Delibration AI Chat Assistant",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Chat Assistant - Start Your Conversation",
    description:
      "Start a new conversation with our AI-powered chat assistant. Get intelligent responses and boost your productivity.",
    images: ["/og/default.png"],
  },
};

export default async function Page() {
  const id = generateUUID();
  let isPro = false;
  const session = await auth();
  const isGuest = !session?.user;

  if (session?.user?.email) {
    try {
      const dbUser: any = await getUserByEmail(session.user.email);
      isPro = !!dbUser?.isPro;
    } catch {}
  }

  return (
    <Chat
      key={id}
      id={id}
      initialMessages={[]}
      isPro={isPro}
      isGuest={isGuest}
    />
  );
}
