import { Metadata } from "next";

import { Chat } from "@/components/custom/chat";
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
  },
  twitter: {
    title: "AI Chat Assistant - Start Your Conversation",
    description:
      "Start a new conversation with our AI-powered chat assistant. Get intelligent responses and boost your productivity.",
  },
};

export default async function Page() {
  const id = generateUUID();
  return <Chat key={id} id={id} initialMessages={[]} />;
}
