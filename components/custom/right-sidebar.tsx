"use client";

import { UIMessage } from "ai";
import { Dispatch, SetStateAction } from "react";

import type { NodeType } from "@/lib/message-to-nodes";

import { AnnotationThreadView } from "./annotation-thread-view";
import { DefaultSidebarView } from "./default-sidebar-view";
import { PendingAnnotationView } from "./pending-annotation-view";
import { ThreadView } from "./thread-view";
import type { Attachment } from "./types";

interface RightSidebarProps {
  // Main chat input props
  input: string;
  setInput: (value: string) => void;
  handleSubmit: (e?: React.FormEvent) => void;
  status: "idle" | "streaming" | "submitted" | "error";
  stop: () => void;
  attachments: Attachment[];
  setAttachments: Dispatch<SetStateAction<Attachment[]>>;
  messages: UIMessage[];
  sendMessage: (message: { text: string; files?: any[]; options?: { body?: any } }) => Promise<void>;

  // Node type selection
  selectedNodeType: NodeType;
  setSelectedNodeType: (type: NodeType) => void;

  // Sidebar content state
  activeThread: { parentMessage: UIMessage; selectedText?: string } | null;
  activeAnnotation: { id: string; selectedText: string } | null;
  pendingAnnotation: { messageId: string; selectedText: string } | null;

  // Sidebar actions
  onCloseThread: () => void;
  onCloseAnnotation: () => void;
  onCreateAnnotation: (firstMessage: string) => Promise<string | null>;
  onAnnotationCreated: (annotationId: string, selectedText: string) => void;
  onAnnotationDeleted: () => void;

  // Other
  chatId: string;
  selectedModel: string;
  isUserPro: boolean;
  isGuest: boolean;
  usageLimitInfo: {
    exceeded: boolean;
    isPro: boolean;
    currentUsage: number;
    limit: number;
    periodEnd: Date | string;
  } | null;
}

export function RightSidebar({
  input,
  setInput,
  handleSubmit,
  status,
  stop,
  attachments,
  setAttachments,
  messages,
  sendMessage,
  selectedNodeType,
  setSelectedNodeType,
  activeThread,
  activeAnnotation,
  pendingAnnotation,
  onCloseThread,
  onCloseAnnotation,
  onCreateAnnotation,
  onAnnotationCreated,
  onAnnotationDeleted,
  chatId,
  selectedModel,
  isUserPro,
  isGuest,
  usageLimitInfo,
}: RightSidebarProps) {
  if (activeThread) {
    return (
      <ThreadView
        parentMessage={activeThread.parentMessage}
        selectedText={activeThread.selectedText}
        mainChatId={chatId}
        onClose={onCloseThread}
        className="size-full"
        modelId={selectedModel}
      />
    );
  }

  if (activeAnnotation) {
    return (
      <AnnotationThreadView
        annotationId={activeAnnotation.id}
        selectedText={activeAnnotation.selectedText}
        chatId={chatId}
        onClose={onCloseAnnotation}
        onDelete={onAnnotationDeleted}
        className="size-full"
        modelId={selectedModel}
      />
    );
  }

  if (pendingAnnotation) {
    return (
      <PendingAnnotationView
        selectedText={pendingAnnotation.selectedText}
        messageId={pendingAnnotation.messageId}
        chatId={chatId}
        onClose={onCloseAnnotation}
        onCreateAnnotation={onCreateAnnotation}
        onAnnotationCreated={onAnnotationCreated}
        className="size-full"
      />
    );
  }

  return (
    <DefaultSidebarView
      input={input}
      setInput={setInput}
      handleSubmit={handleSubmit}
      status={status}
      stop={stop}
      attachments={attachments}
      setAttachments={setAttachments}
      messages={messages}
      sendMessage={sendMessage}
      isGuest={isGuest}
      usageLimitInfo={usageLimitInfo}
      selectedNodeType={selectedNodeType}
      setSelectedNodeType={setSelectedNodeType}
    />
  );
}
