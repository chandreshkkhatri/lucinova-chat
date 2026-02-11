"use client";

import { UIMessage } from "ai";
import { MessageSquare, MessagesSquare, Sparkles, X } from "lucide-react";
import { Dispatch, SetStateAction, useMemo } from "react";

import type { NodeType } from "@/lib/message-to-nodes";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
}: RightSidebarProps) {
  const hasThread = !!activeThread;
  const hasAnnotation = !!(activeAnnotation || pendingAnnotation);
  const hasMultipleTabs = hasThread || hasAnnotation;

  // Determine active tab
  const activeTab = useMemo(() => {
    if (activeAnnotation || pendingAnnotation) return "annotation";
    if (activeThread) return "thread";
    return "chat";
  }, [activeAnnotation, pendingAnnotation, activeThread]);

  // When only the chat tab exists, render without tab chrome
  if (!hasMultipleTabs) {
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
        selectedModel={selectedModel}
        setSelectedModel={setSelectedModel}
        isUserPro={isUserPro}
        isMounted={isMounted}
      />
    );
  }

  return (
    <Tabs value={activeTab} className="flex flex-col size-full">
      <TabsList className="w-full justify-start rounded-none border-b border-border bg-background h-9 p-0 shrink-0">
        <TabsTrigger
          value="chat"
          className="flex-1 gap-1.5 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none h-full"
        >
          <MessageSquare className="size-3.5" />
          <span className="text-xs">Chat</span>
        </TabsTrigger>

        {hasThread && (
          <TabsTrigger
            value="thread"
            className="flex-1 gap-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none h-full"
          >
            <MessagesSquare className="size-3.5" />
            <span className="text-xs">Thread</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCloseThread();
              }}
              className="ml-0.5 rounded-sm p-0.5 hover:bg-muted"
            >
              <X className="size-3" />
            </button>
          </TabsTrigger>
        )}

        {hasAnnotation && (
          <TabsTrigger
            value="annotation"
            className="flex-1 gap-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none h-full"
          >
            <Sparkles className="size-3.5" />
            <span className="text-xs">Ask AI</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCloseAnnotation();
              }}
              className="ml-0.5 rounded-sm p-0.5 hover:bg-muted"
            >
              <X className="size-3" />
            </button>
          </TabsTrigger>
        )}
      </TabsList>

      <TabsContent value="chat" className="flex-1 mt-0 overflow-hidden">
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
          selectedModel={selectedModel}
          setSelectedModel={setSelectedModel}
          isUserPro={isUserPro}
          isMounted={isMounted}
        />
      </TabsContent>

      {hasThread && (
        <TabsContent value="thread" className="flex-1 mt-0 overflow-hidden">
          <ThreadView
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
              annotationId={activeAnnotation.id}
              selectedText={activeAnnotation.selectedText}
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
