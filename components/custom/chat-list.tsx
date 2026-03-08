"use client";

import {
  Sparkles,
  MessageSquare,
  Bot,
  GitBranch,
  FileCode,
  Copy,
  Check,
  Pencil,
  RefreshCw,
} from "lucide-react";
import Image from "next/image";
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { preload } from "swr";

import { fetchUserSuggestions, fetchContextualSuggestions } from "@/app/actions/suggestions";
import { Message } from "@/lib/chat-utils";
import { SUGGESTIONS } from "@/lib/constants";
import { Suggestion } from "@/lib/suggestions";

import { ChatInput } from "./chat-input";
import { EnhancedMessage, SavedAnnotation } from "./enhanced-message";
import { useScrollToBottom } from "./use-scroll-to-bottom";
import { useThreadCounts } from "./use-thread-counts";

import type { Attachment } from "./types";
import type { NodeType } from "@/lib/message-to-nodes";

const threadFetcher = (url: string) =>
  fetch(url).then((r) => (r.ok ? r.json() : { threads: [] }));

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
  onRegenerate?: () => void;
  onEditMessage?: (newContent: string) => Promise<void>;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  isUserPro?: boolean;
  isThread?: boolean;
  selectedText?: string;
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
  onRegenerate,
  onEditMessage,
  selectedModel,
  setSelectedModel,
  isUserPro,
  isThread,
  selectedText,
}: ChatListProps) {
  const [messagesContainerRef, messagesEndRef] =
    useScrollToBottom<HTMLDivElement>();
  const [selectedNodeType, setSelectedNodeType] = useState<NodeType>("text");
  // Only fetch thread counts when chat has messages (chat exists in DB)
  const hasMessages = messages.length > 0;
  const { threadCounts, refresh: refreshThreadCounts } = useThreadCounts(hasMessages ? chatId : "");

  // Prefetch thread messages for all messages that have threads
  const prefetchedRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!chatId || !threadCounts) return;
    Object.entries(threadCounts).forEach(([messageId, count]) => {
      if (count > 0 && !prefetchedRef.current.has(messageId)) {
        prefetchedRef.current.add(messageId);
        preload(
          `/api/threads?parentMessageId=${messageId}&mainChatId=${chatId}`,
          threadFetcher
        );
      }
    });
  }, [threadCounts, chatId]);

  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  useEffect(() => {
    async function loadSuggestions() {
      try {
        if (isThread && selectedText) {
          const data = await fetchContextualSuggestions(selectedText);
          if (data && data.length > 0) {
            setSuggestions(data);
          } else {
            // fallback
            const fallback = await fetchUserSuggestions();
            setSuggestions(fallback);
          }
        } else {
          const data = await fetchUserSuggestions();
          setSuggestions(data);
        }
      } catch (error) {
        console.error("Failed to load suggestions:", error);
      }
    }
    loadSuggestions();
  }, [isThread, selectedText]);

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
              <h2 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-b from-foreground to-foreground/50">
                Lucidity Chat
              </h2>
              <p className="text-xl text-muted-foreground max-w-lg mb-10 leading-relaxed">
                Unlock your potential with advanced AI. Ask questions, explore
                ideas, and get precise answers in seconds.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl mt-4">
                {suggestions.map((suggestion, i) => {
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
                          : suggestion.color === "purple"
                            ? "text-purple-500"
                            : suggestion.color === "indigo"
                              ? "text-indigo-500"
                              : suggestion.color === "rose"
                                ? "text-rose-500"
                                : "text-teal-500";

                  return (
                    <button
                      key={suggestion.value}
                      onClick={() => setInput(suggestion.value)}
                      className="p-4 text-left rounded-2xl border border-border/40 hover:border-primary/30 hover:bg-primary/5 hover:scale-[1.02] transition-all flex items-center gap-4 bg-card/40 backdrop-blur-sm group shadow-sm"
                      style={{
                        animation: `canvas-fade-in-up 500ms ease-out ${300 + i * 80}ms forwards`,
                        opacity: 0,
                      }}
                    >
                      <div className="size-10 rounded-xl bg-background flex items-center justify-center border border-border/50 group-hover:border-primary/20 transition-colors">
                        <Icon className={`size-5 ${colorClass} shrink-0`} />
                      </div>
                      <p className="text-sm font-medium text-foreground/90 group-hover:text-foreground">
                        {suggestion.label}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            messages.map((message, index) => {
              const isUser = message.role === "user";
              const isSystem = message.role === "system";

              if (isSystem) return null;

              // Determine if this is the last user/assistant message for edit/regenerate
              const lastUserIdx = messages.map(m => m.role).lastIndexOf('user');
              const lastAssistantIdx = messages.map(m => m.role).lastIndexOf('assistant');
              const isLastUser = isUser && index === lastUserIdx;
              const isLastAssistant = !isUser && index === lastAssistantIdx;

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

                    {/* Action Bar */}
                    {isUser && isLastUser && status === "idle" && (
                      <div className="flex items-center gap-1 mt-2">
                        <EditMessageButton
                          message={message}
                          onEditMessage={onEditMessage}
                        />
                      </div>
                    )}
                    {!isUser && (
                      <div className="flex items-center gap-1 mt-2">
                        <ThreadReplyButton
                          messageId={message.id}
                          threadCount={threadCounts[message.id] ?? 0}
                          onStartThread={onStartThread}
                        />
                        <CopyMessageButton message={message} />
                        {isLastAssistant && status === "idle" && onRegenerate && (
                          <button
                            onClick={onRegenerate}
                            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded-md hover:bg-muted transition-colors"
                            title="Regenerate response"
                          >
                            <RefreshCw className="size-3.5" />
                            <span>Regenerate</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {/* Loading Indicator — only before first token arrives */}
          {status === "submitted" && (
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

/** Sub-component: receives count as prop instead of fetching it independently */
function ThreadReplyButton({
  messageId,
  threadCount,
  onStartThread,
}: {
  messageId: string;
  threadCount: number;
  onStartThread: (messageId: string) => void;
}) {
  return (
    <button
      id={`reply-btn-${messageId}`}
      onClick={() => onStartThread(messageId)}
      className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors text-xs font-medium"
      title="Reply in thread"
    >
      <MessageSquare className="size-3.5" />
      {threadCount > 0 ? (
        <span>
          {threadCount} {threadCount === 1 ? "reply" : "replies"}
        </span>
      ) : (
        <span>Reply</span>
      )}
    </button>
  );
}

/** Extract plain text content from a message */
function getMessageTextContent(message: Message): string {
  if ((message as any).parts) {
    const text = (message as any).parts
      .filter((p: any) => p.type === "text")
      .map((p: any) => p.text)
      .join("");
    if (text) return text;
  }
  const rawContent = (message as any).content;
  if (
    typeof rawContent === "string" &&
    !rawContent.startsWith("[object Object]")
  ) {
    return rawContent;
  }
  return "";
}

/** Copy message content to clipboard */
function CopyMessageButton({ message }: { message: Message }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const text = getMessageTextContent(message);
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors text-xs font-medium"
      title={copied ? "Copied!" : "Copy message"}
    >
      {copied ? (
        <Check className="size-3.5" />
      ) : (
        <Copy className="size-3.5" />
      )}
      <span>{copied ? "Copied" : "Copy"}</span>
    </button>
  );
}

/** Edit the last user message and get a fresh AI response */
function EditMessageButton({
  message,
  onEditMessage,
}: {
  message: Message;
  onEditMessage?: (newContent: string) => Promise<void>;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState("");

  const handleStartEdit = () => {
    setEditContent(getMessageTextContent(message));
    setIsEditing(true);
  };

  const handleSubmitEdit = async () => {
    if (!editContent.trim() || !onEditMessage) return;
    setIsEditing(false);
    await onEditMessage(editContent.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmitEdit();
    }
    if (e.key === "Escape") {
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <div className="w-full mt-1">
        <textarea
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full p-2 text-sm rounded-lg border border-border bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
          rows={3}
          autoFocus
        />
        <div className="flex items-center gap-2 mt-1.5">
          <button
            onClick={handleSubmitEdit}
            className="text-xs px-3 py-1 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
          >
            Save & Resend
          </button>
          <button
            onClick={() => setIsEditing(false)}
            className="text-xs px-3 py-1 rounded-md hover:bg-muted text-muted-foreground transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={handleStartEdit}
      className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors text-xs font-medium"
      title="Edit message"
    >
      <Pencil className="size-3.5" />
      <span>Edit</span>
    </button>
  );
}
