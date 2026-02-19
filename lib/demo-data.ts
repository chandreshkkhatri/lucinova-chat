import { SavedAnnotation } from "@/components/custom/enhanced-message";

import { Message } from "./chat-utils";

export const DEMO_MESSAGES: Message[] = [
  {
    id: "demo-msg-1",
    role: "user",
    content: "How does the annotation feature work?",
    createdAt: new Date(),
  },
  {
    id: "demo-msg-2",
    role: "assistant",
    content: "Lucidity allows you to select any text to start a focused discussion. For example, I've highlighted this text to show you how an annotation looks.",
    createdAt: new Date(),
  },
];

export const DEMO_ANNOTATIONS: Record<string, SavedAnnotation[]> = {
  "demo-msg-2": [
    {
      id: "demo-ann-1",
      messageId: "demo-msg-2",
      selectedText: "highlighted this text",
      messageCount: 1, // Show "1 reply" badge on icon
    },
  ],
};
