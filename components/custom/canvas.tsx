"use client";

import { UIMessage } from "ai";
import { Sparkles, Reply, Crown } from "lucide-react";
import Image from "next/image";
import { useState, useMemo, Dispatch, SetStateAction } from "react";

import { useScrollToBottom } from "@/components/custom/use-scroll-to-bottom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { appConfig } from "@/lib/config";
import { messagesToNodes } from "@/lib/message-to-nodes";

import { CanvasNodeComponent } from "./canvas-node";
import { MultimodalInput } from "./multimodal-input";
import { UsageLimitBanner } from "./usage-limit-banner";
import type { SavedAnnotation } from "./enhanced-message";
import type { Attachment } from "./types";

interface CanvasProps {
  messages: UIMessage[];
  status: "idle" | "streaming" | "submitted" | "error";
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  isMounted: boolean;
  isThread: boolean;
  isUserPro: boolean;
  chatId: string;
  annotationsByMessage: Record<string, SavedAnnotation[]>;
  onStartThread: (messageId: string, selectedText?: string) => void;
  onAskLucinova: (messageId: string, selectedText: string) => void;
  onOpenAnnotation: (annotationId: string, selectedText: string) => void;
  setInput: (value: string) => void;
  selectedText?: string;
  // Mobile input props (rendered only on mobile via lg:hidden)
  input: string;
  handleSubmit: (e?: React.FormEvent) => void;
  stop: () => void;
  attachments: Attachment[];
  setAttachments: Dispatch<SetStateAction<Attachment[]>>;
  sendMessage: (message: { text: string; files?: any[]; options?: { body?: any } }) => Promise<void>;
  isGuest: boolean;
  usageLimitInfo: {
    exceeded: boolean;
    isPro: boolean;
    currentUsage: number;
    limit: number;
    periodEnd: Date | string;
  } | null;
}

export function Canvas({
  messages,
  status,
  selectedModel,
  setSelectedModel,
  isMounted,
  isThread,
  isUserPro,
  chatId,
  annotationsByMessage,
  onStartThread,
  onAskLucinova,
  onOpenAnnotation,
  setInput,
  selectedText,
  input,
  handleSubmit,
  stop,
  attachments,
  setAttachments,
  sendMessage,
  isGuest,
  usageLimitInfo,
}: CanvasProps) {
  const [messagesContainerRef, messagesEndRef] =
    useScrollToBottom<HTMLDivElement>();

  // Convert messages to canvas nodes
  const nodes = useMemo(() => messagesToNodes(messages), [messages]);

  // Build a message lookup for passing to CanvasNodeComponent
  const messageById = useMemo(() => {
    const map = new Map<string, UIMessage>();
    for (const msg of messages) {
      map.set(msg.id, msg);
    }
    return map;
  }, [messages]);

  return (
    <div className={`flex flex-col h-full ${isThread ? "max-h-full overflow-hidden" : ""}`}>
      {/* Model Selector Header */}
      {!isThread && isMounted && (
        <div className="border-b border-border px-3 sm:px-4 py-2 sm:py-3 shrink-0">
          <div className="flex items-center justify-center sm:justify-start h-10 lg:h-auto">
            <div className="">
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger className="w-[160px] sm:w-[200px] h-9 sm:h-10 bg-card border-border text-sm sm:text-base">
                  <div className="flex items-center gap-2">
                    <Sparkles className="size-4 text-primary" />
                    <SelectValue placeholder="Select a model" />
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem
                    value="gemini-3.0-flash"
                    className={isUserPro ? "hover:bg-muted" : "opacity-50 cursor-not-allowed"}
                    disabled={!isUserPro}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{appConfig.getModelDisplayName("gemini-3.0-flash")}</span>
                      <Crown className="size-3 text-yellow-500" />
                      {!isUserPro && <span className="text-xs text-muted-foreground ml-1">Pro</span>}
                    </div>
                  </SelectItem>
                  <SelectItem value="gemini-2.5-flash" className="hover:bg-muted">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{appConfig.getModelDisplayName("gemini-2.5-flash")}</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="gemini-2.0-flash" className="hover:bg-muted">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{appConfig.getModelDisplayName("gemini-2.0-flash")}</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}
      {/* Placeholder for server render to prevent layout shift */}
      {!isThread && !isMounted && (
        <div className="border-b border-border px-3 sm:px-4 py-2 sm:py-3 shrink-0">
          <div className="flex items-center justify-center sm:justify-start h-10 lg:h-auto">
            <div className="w-[160px] sm:w-[200px] h-9 sm:h-10 bg-muted rounded animate-pulse" />
          </div>
        </div>
      )}

      {/* Canvas Content - Nodes */}
      <div
        className={`flex-1 overflow-y-auto min-h-0 ${isThread ? "max-h-full" : ""}`}
        ref={messagesContainerRef}
      >
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full p-8">
            <div className="text-center max-w-md">
              {isThread && selectedText ? (
                <>
                  <div className="size-12 mx-auto mb-4 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center">
                    <Sparkles className="size-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Ask about your selection</h3>
                  <p className="text-muted-foreground mb-6 text-sm">What would you like to know about the selected text?</p>
                  <div className="flex flex-col gap-2 mb-4">
                    {["Can you explain this in simpler terms?", "What are the key points here?", "Can you provide more context about this?", "How does this relate to the main topic?"].map((suggestion) => (
                      <button key={suggestion} onClick={() => setInput(suggestion)} className="p-3 text-left rounded-lg border border-border hover:bg-muted transition-colors">
                        <p className="text-sm text-foreground/80">{suggestion}</p>
                      </button>
                    ))}
                  </div>
                </>
              ) : isThread ? (
                <>
                  <div className="size-12 mx-auto mb-4 rounded-xl bg-muted border border-border flex items-center justify-center">
                    <Reply className="size-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Thread Discussion</h3>
                  <p className="text-muted-foreground mb-6 text-sm">Continue the conversation about the parent message.</p>
                </>
              ) : (
                <>
                  <div className="size-16 mx-auto mb-4 rounded-xl flex items-center justify-center">
                    <Image src="/images/lucidity-logo.svg" alt="Lucidity" width={64} height={64} className="size-full object-contain" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">Welcome to Lucidity</h2>
                  <p className="text-muted-foreground mb-6">Think in threads, learn in layers.</p>
                  <div className="flex flex-col gap-2 mb-4">
                    {[
                      { label: "Explain a complex concept simply", value: "Explain a complex concept to me" },
                      { label: "Create a personalized study plan", value: "Help me create a study plan for a new subject" },
                      { label: "Summarize and extract key points", value: "Summarize this text and extract key learning points" },
                    ].map((suggestion) => (
                      <button key={suggestion.value} onClick={() => setInput(suggestion.value)} className="p-3 text-left rounded-lg border border-border hover:bg-muted transition-colors">
                        <p className="text-sm text-foreground/80">{suggestion.label}</p>
                      </button>
                    ))}
                  </div>
                  <div className="text-xs text-muted-foreground hidden lg:block">
                    Start a conversation in the sidebar
                  </div>
                  <div className="text-xs text-muted-foreground lg:hidden">
                    Type your message below to start
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="py-4">
            {nodes.map((node) => {
              const message = messageById.get(node.messageId);
              if (!message) return null;
              return (
                <CanvasNodeComponent
                  key={node.id}
                  node={node}
                  message={message}
                  chatId={chatId}
                  annotations={annotationsByMessage[message.id]}
                  onAskLucinova={onAskLucinova}
                  onOpenAnnotation={onOpenAnnotation}
                  onStartThread={onStartThread}
                  isThread={isThread}
                  showActions={!isThread}
                />
              );
            })}
          </div>
        )}

        {(status === "streaming" || status === "submitted") && (
          <div className="p-3">
            <div className="flex items-center gap-2">
              <Avatar className="size-8 shrink-0">
                <AvatarFallback className="bg-card border border-border p-1">
                  <Image src="/images/lucidity-logo.svg" alt="Lucidity" width={24} height={24} className="size-full object-contain" />
                </AvatarFallback>
              </Avatar>
              <div className="bg-muted rounded-2xl rounded-tl-sm px-3 py-2">
                <div className="typing-indicator flex gap-1">
                  <span className="size-2 bg-muted-foreground rounded-full"></span>
                  <span className="size-2 bg-muted-foreground rounded-full"></span>
                  <span className="size-2 bg-muted-foreground rounded-full"></span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} className="shrink-0 min-w-[24px] min-h-[24px]" />
      </div>

      {/* Input - for threads: always visible; for main chat: mobile only (desktop uses right sidebar) */}
      <div className={`border-t border-border p-3 sm:p-4 shrink-0 ${!isThread ? "lg:hidden" : ""}`}>
        <div className="max-w-4xl mx-auto">
          {usageLimitInfo?.exceeded ? (
            <UsageLimitBanner
              isPro={usageLimitInfo.isPro}
              currentUsage={usageLimitInfo.currentUsage}
              limit={usageLimitInfo.limit}
              periodEnd={usageLimitInfo.periodEnd}
            />
          ) : isGuest && messages.filter((m) => m.role === "user").length >= 5 ? (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground">Guest limit reached. Sign up to continue.</p>
            </div>
          ) : (
            <MultimodalInput
              input={input}
              setInput={setInput}
              isLoading={status === "streaming" || status === "submitted"}
              stop={stop}
              attachments={attachments}
              setAttachments={setAttachments}
              messages={messages}
              sendMessage={sendMessage}
              handleSubmit={handleSubmit}
            />
          )}
        </div>
      </div>
    </div>
  );
}
