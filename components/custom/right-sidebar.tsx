"use client";

import { MessagesSquare, Sparkles, X } from "lucide-react";
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Message } from "@/lib/chat-utils";

import { AnnotationThreadView } from "./annotation-thread-view";
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

  // Sidebar content state
  activeThread: { parentMessage: Message; selectedText?: string } | null;
  activeAnnotation: { id: string; selectedText: string; initialMessage?: string; isNew?: boolean } | null;
  pendingAnnotation: { messageId: string; selectedText: string; isLoading?: boolean } | null;

  // Sidebar actions
  onCloseThread: () => void;
  onCloseAnnotation: () => void;
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
  activeThread,
  activeAnnotation,
  pendingAnnotation,
  onCloseThread,
  onCloseAnnotation,
  onAnnotationDeleted,
  selectedModel,
  setSelectedModel,
  isMounted,
  chatId,
  isUserPro,
  isGuest,
  usageLimitInfo,
}: RightSidebarProps) {
  const hasThread = !!activeThread;
  const hasAnnotation = !!(activeAnnotation || pendingAnnotation);
  const hasMultipleTabs = hasThread || hasAnnotation;

  // Tab state: auto-switch when views open, allow manual switching
  // Initialize with empty string to avoid "null" value warning in Tabs
  const [activeTab, setActiveTab] = useState<string>(() => {
    if (activeAnnotation || pendingAnnotation) return "annotation";
    if (activeThread) return "thread";
    return "";
  });

  useEffect(() => {
    if (activeAnnotation || pendingAnnotation) {
      setActiveTab("annotation");
    } else if (activeThread) {
      setActiveTab("thread");
    } else {
      setActiveTab("");
    }
  }, [activeAnnotation, pendingAnnotation, activeThread]);

  const sidebarRef = useRef<HTMLDivElement>(null);

  // Auto-focus the textarea when a thread or annotation opens so the user
  // can start typing immediately without an extra tap/click.
  const annotationId = activeAnnotation?.id ?? null;
  const threadId = activeThread?.parentMessage?.id ?? null;
  useEffect(() => {
    if (!annotationId && !threadId) return;
    // Wait for the sidebar animation (300 ms) and any async rendering to finish.
    const timer = setTimeout(() => {
      const textarea = sidebarRef.current?.querySelector<HTMLTextAreaElement>("textarea");
      textarea?.focus();
    }, 350);
    return () => clearTimeout(timer);
  }, [annotationId, threadId]);

  if (!hasMultipleTabs) {
    return null;
  }

  return (
    <div ref={sidebarRef} className="flex flex-col size-full">
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
              isNew={activeAnnotation.isNew}
            />
          ) : pendingAnnotation?.isLoading ? (
            <div className="flex flex-col bg-secondary h-full min-h-full">
              {/* Header Skeleton */}
              <div className="px-4 py-3 border-b border-border bg-card flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <div className="size-8 rounded-lg bg-muted flex items-center justify-center animate-pulse" />
                  <div>
                    <div className="h-4 w-24 bg-muted rounded animate-pulse mb-1" />
                    <div className="h-3 w-16 bg-muted rounded animate-pulse" />
                  </div>
                </div>
              </div>
              
              {/* Selected Text Skeleton */}
              <div className="px-4 py-3 bg-purple-50 dark:bg-purple-900/20 border-b border-purple-100 dark:border-purple-800/30 shrink-0">
                <div className="text-sm italic text-foreground/80 bg-card rounded-lg px-4 py-2 border-l-4 border-purple-400 dark:border-purple-500">
                  {'"'}{pendingAnnotation.selectedText}{'"'}
                </div>
              </div>
              
              <div className="flex-1 flex items-center justify-center">
                <p className="text-sm text-muted-foreground animate-pulse">Creating annotation...</p>
              </div>
            </div>
          ) : null}
        </TabsContent>
      )}
    </Tabs>
    </div>
  );
}
