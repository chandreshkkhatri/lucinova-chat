"use client";

import { Message } from "@/lib/chat-utils";
import {
  Sparkles,
  MessageSquare,
  Bot,
  GitBranch,
  FileCode,
} from "lucide-react";
import Image from "next/image";
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";

import { SUGGESTIONS } from "@/lib/constants";

import { ChatInput } from "./chat-input";
import { EnhancedMessage, SavedAnnotation } from "./enhanced-message";
import { useScrollToBottom } from "./use-scroll-to-bottom";
import { useThreadCount } from "./use-thread-count";

import type { Attachment } from "./types";
import type { NodeType } from "@/lib/message-to-nodes";

interface ChatListProps {
  messages: Message[];
  status: "idle" | "streaming" | "submitted" | "error";
  input: string;
  setInput: (value: string) => void;
  handleSubmit: (e?: React.FormEvent) => void;
  stop: () => void;
  attachments: Attachment[];
  setAttachments: Dispatch<SetStateAction<Attachment[]>>;
  sendMessage: (message: {
    text: string;
    files?: any[];
    options?: { body?: any };
  }) => Promise<void>;
  isGuest: boolean;
  usageLimitInfo: {
    exceeded: boolean;
    isPro: boolean;
    currentUsage: number;
    limit: number;
    periodEnd: Date | string;
  } | null;
  chatId: string;
  annotationsByMessage: Record<string, SavedAnnotation[]>;
  onStartThread: (messageId: string, selectedText?: string) => void;
  onAskLucinova: (messageId: string, selectedText: string) => void;
  onOpenAnnotation: (annotationId: string, selectedText: string) => void;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  isUserPro?: boolean;
}

export function ChatList({
  messages,
  status,
  input,
  setInput,
  handleSubmit,
  stop,
  attachments,
  setAttachments,
  sendMessage,
  isGuest,
  usageLimitInfo,
  chatId,
  annotationsByMessage,
  onStartThread,
  onAskLucinova,
  onOpenAnnotation,
  selectedModel,
  setSelectedModel,
  isUserPro,
}: ChatListProps) {
  const [messagesContainerRef, messagesEndRef] =
    useScrollToBottom<HTMLDivElement>();
  const [selectedNodeType, setSelectedNodeType] = useState<NodeType>("text");

  return (
    <div className="flex flex-col size-full bg-paper relative">
      {/* Messages Area */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto w-full">
        <div className="flex flex-col gap-6 md:gap-8 max-w-3xl mx-auto py-8 px-4">
          {messages.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center p-8 text-center min-h-[50vh]"
              style={{
                animation: "canvas-fade-in-up 600ms ease-out 100ms forwards",
                opacity: 0,
              }}
            >
              <div className="size-16 mx-auto mb-4 rounded-xl flex items-center justify-center">
                <Image
                  src="/images/lucidity-logo.svg"
                  alt="Lucidity"
                  width={64}
                  height={64}
                  className="size-full object-contain"
                />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Lucidity Chat
              </h2>
              <p className="text-muted-foreground max-w-md">
                Ask questions, explore ideas, and get answers powered by
                advanced AI. Start by typing a message below.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl mt-8">
                {SUGGESTIONS.map((suggestion, i) => {
                  const Icon =
                    suggestion.iconName === "message"
                      ? MessageSquare
                      : suggestion.iconName === "diagram"
                        ? GitBranch
                        : suggestion.iconName === "code"
                          ? FileCode
                          : Sparkles;

                  const colorClass =
                    suggestion.color === "blue"
                      ? "text-blue-500"
                      : suggestion.color === "green"
                        ? "text-green-500"
                        : suggestion.color === "orange"
                          ? "text-orange-500"
                          : "text-purple-500";

                  return (
                    <button
                      key={suggestion.value}
                      onClick={() => setInput(suggestion.value)}
                      className="p-3 text-left rounded-xl border border-border/50 hover:border-border hover:bg-muted/50 transition-all flex items-center gap-3 bg-card/50"
                      style={{
                        animation: `canvas-fade-in-up 500ms ease-out ${300 + i * 80}ms forwards`,
                        opacity: 0,
                      }}
                    >
                      <Icon className={`size-4 ${colorClass} shrink-0`} />
                      <p className="text-sm text-foreground/80">
                        {suggestion.label}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            messages.map((message) => {
              const isUser = message.role === "user";
              const isSystem = message.role === "system";

              if (isSystem) return null;

              return (
                <div
                  key={message.id}
                  className="group relative flex gap-4 pr-4"
                >
                  {/* Avatar */}
                  <div className="shrink-0">
                    {isUser ? (
                      <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-medium text-xs">
                        You
                      </div>
                    ) : (
                      <div className="size-8 rounded-lg flex items-center justify-center shadow-sm border border-border bg-card">
                        <Image
                          src="/icon.svg"
                          alt="AI"
                          width={20}
                          height={20}
                          className="size-5"
                        />
                      </div>
                    )}
                  </div>

                  {/* Message Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-foreground">
                        {isUser ? "You" : "Lucinova"}
                      </span>
                    </div>

                    <EnhancedMessage
                      message={message}
                      chatId={chatId}
                      annotations={annotationsByMessage[message.id] || []}
                      onAskLucinova={(text) => onAskLucinova(message.id, text)}
                      onOpenAnnotation={(id, text) =>
                        onOpenAnnotation(id, text)
                      }
                    />

                    {/* Action Bar (Simple version for Chat List) */}
                    {!isUser && (
                      <ThreadReplyButton
                        messageId={message.id}
                        chatId={chatId}
                        onStartThread={onStartThread}
                      />
                    )}
                  </div>
                </div>
              );
            })
          )}

          {/* Streaming / Loading Indicator */}
          {(status === "submitted" || status === "streaming") && (
            <div className="group relative flex gap-4 pr-4">
              <div className="shrink-0">
                <div className="size-8 rounded-lg flex items-center justify-center shadow-sm border border-border bg-card">
                  <Image
                    src="/icon.svg"
                    alt="AI"
                    width={20}
                    height={20}
                    className="size-5"
                  />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-foreground">Lucinova</span>
                </div>
                <div className="flex items-center gap-1 py-2">
                  <span className="size-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="size-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="size-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} className="h-px w-full" />
        </div>
      </div>

      {/* Input Area (Sticky Bottom) */}
      <ChatInput
        input={input}
        setInput={setInput}
        isLoading={status === "streaming" || status === "submitted"}
        stop={stop}
        attachments={attachments}
        setAttachments={setAttachments}
        messages={messages}
        sendMessage={sendMessage}
        handleSubmit={handleSubmit}
        selectedNodeType={selectedNodeType}
        setSelectedNodeType={setSelectedNodeType}
        usageLimitInfo={usageLimitInfo}
        variant="sticky"
        selectedModel={selectedModel}
        setSelectedModel={setSelectedModel}
        isUserPro={isUserPro}
      />
    </div>
  );
}

/** Sub-component so we can call useThreadCount per-message */
function ThreadReplyButton({
  messageId,
  chatId,
  onStartThread,
}: {
  messageId: string;
  chatId: string;
  onStartThread: (messageId: string) => void;
}) {
  const { threadCount } = useThreadCount(messageId, chatId);

  return (
    <div className={`flex items-center gap-2 mt-2 ${
      threadCount > 0
        ? "opacity-100"
        : "opacity-0 group-hover:opacity-100"
    } transition-opacity`}>
      <button
        onClick={() => onStartThread(messageId)}
        className="flex items-center gap-1 p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        title="Reply in thread"
      >
        <MessageSquare className="size-4" />
        {threadCount > 0 && (
          <span className="text-xs">
            {threadCount} {threadCount === 1 ? "reply" : "replies"}
          </span>
        )}
      </button>
    </div>
  );
}
