"use client";

import { MessagesSquare, Sparkles, X } from "lucide-react";
import { Dispatch, SetStateAction, useEffect, useState } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Message } from "@/lib/chat-utils";

import { AnnotationThreadView } from "./annotation-thread-view";
import { PendingAnnotationView } from "./pending-annotation-view";
import { ThreadView } from "./thread-view";
import type { Attachment } from "./types";
import type { NodeType } from "@/lib/message-to-nodes";

interface RightSidebarProps {
  // Main chat input props
  input: string;
  setInput: (value: string) => void;
  handleSubmit: (e?: React.FormEvent) => void;
  status: "idle" | "streaming" | "submitted" | "error";
  stop: () => void;
  attachments: Attachment[];
  setAttachments: Dispatch<SetStateAction<Attachment[]>>;
  messages: Message[];
  sendMessage: (message: { text: string; files?: any[]; options?: { body?: any } }) => Promise<void>;

  // Node type selection
  selectedNodeType: NodeType;
  setSelectedNodeType: (type: NodeType) => void;

  // Sidebar content state
  activeThread: { parentMessage: Message; selectedText?: string } | null;
  activeAnnotation: { id: string; selectedText: string; initialMessage?: string } | null;
  pendingAnnotation: { messageId: string; selectedText: string } | null;

  // Sidebar actions
  onCloseThread: () => void;
  onCloseAnnotation: () => void;
  onCreateAnnotation: (firstMessage: string) => Promise<string | null>;
  onAnnotationCreated: (annotationId: string, selectedText: string) => void;
  onAnnotationDeleted: () => void;

  // Model selector
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  isMounted: boolean;

  // Other
  chatId: string;
  isUserPro: boolean;
  isGuest: boolean;
  usageLimitInfo: {
    exceeded: boolean;
    isPro: boolean;
    currentUsage: number;
    limit: number;
    periodEnd: Date | string;
  } | null;
  selectedNode: { id: string; content: string; role: string; type: string } | null;
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
  selectedModel,
  setSelectedModel,
  isMounted,
  chatId,
  isUserPro,
  isGuest,
  usageLimitInfo,
  selectedNode,
}: RightSidebarProps) {
  const hasThread = !!activeThread;
  const hasAnnotation = !!(activeAnnotation || pendingAnnotation);
  const hasMultipleTabs = hasThread || hasAnnotation;

  // Tab state: auto-switch when views open, allow manual switching
  const [activeTab, setActiveTab] = useState<string | null>(null);

  useEffect(() => {
    if (activeAnnotation || pendingAnnotation) {
      setActiveTab("annotation");
    } else if (activeThread) {
      setActiveTab("thread");
    } else {
      setActiveTab(null);
    }
  }, [activeAnnotation, pendingAnnotation, activeThread]);

  if (!hasMultipleTabs) {
    return null;
  }

  return (
    <Tabs
      value={activeTab || ""}
      onValueChange={setActiveTab}
      className="flex flex-col size-full"
    >
      <TabsList className="w-full justify-start rounded-none border-b border-border bg-background h-9 p-0 shrink-0">
        {hasThread && (
          <TabsTrigger
            value="thread"
            className="flex-1 gap-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none h-full"
          >
            <MessagesSquare className="size-3.5" />
            <span className="text-xs">Thread</span>
            <div
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onCloseThread();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.stopPropagation();
                  e.preventDefault();
                  onCloseThread();
                }
              }}
              className="ml-0.5 rounded-sm p-0.5 hover:bg-muted cursor-pointer"
            >
              <X className="size-3" />
            </div>
          </TabsTrigger>
        )}

        {hasAnnotation && (
          <TabsTrigger
            value="annotation"
            className="flex-1 gap-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none h-full"
          >
            <Sparkles className="size-3.5" />
            <span className="text-xs">Ask AI</span>
            <div
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onCloseAnnotation();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.stopPropagation();
                  e.preventDefault();
                  onCloseAnnotation();
                }
              }}
              className="ml-0.5 rounded-sm p-0.5 hover:bg-muted cursor-pointer"
            >
              <X className="size-3" />
            </div>
          </TabsTrigger>
        )}
      </TabsList>

      {hasThread && (
        <TabsContent value="thread" className="flex-1 mt-0 overflow-hidden">
          <ThreadView
            key={activeThread!.parentMessage.id}
            parentMessage={activeThread!.parentMessage}
            selectedText={activeThread!.selectedText}
            mainChatId={chatId}
            onClose={onCloseThread}
            className="size-full"
            modelId={selectedModel}
          />
        </TabsContent>
      )}

      {hasAnnotation && (
        <TabsContent value="annotation" className="flex-1 mt-0 overflow-hidden">
          {activeAnnotation ? (
            <AnnotationThreadView
              key={activeAnnotation.id}
              annotationId={activeAnnotation.id}
              selectedText={activeAnnotation.selectedText}
              initialMessage={activeAnnotation.initialMessage}
              chatId={chatId}
              onClose={onCloseAnnotation}
              onDelete={onAnnotationDeleted}
              className="size-full"
              modelId={selectedModel}
            />
          ) : pendingAnnotation ? (
            <PendingAnnotationView
              selectedText={pendingAnnotation.selectedText}
              messageId={pendingAnnotation.messageId}
              chatId={chatId}
              onClose={onCloseAnnotation}
              onCreateAnnotation={onCreateAnnotation}
              onAnnotationCreated={onAnnotationCreated}
              className="size-full"
            />
          ) : null}
        </TabsContent>
      )}
    </Tabs>
  );
}
