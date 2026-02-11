"use client";

import { UIMessage } from "ai";
import { Sparkles, Reply, MessageSquare, FileCode } from "lucide-react";
import Image from "next/image";
import { useMemo, Dispatch, SetStateAction } from "react";

import { useScrollToBottom } from "@/components/custom/use-scroll-to-bottom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { messagesToNodes } from "@/lib/message-to-nodes";

import { CanvasNodeComponent } from "./canvas-node";
import { MultimodalInput } from "./multimodal-input";
import { UsageLimitBanner } from "./usage-limit-banner";

import type { SavedAnnotation } from "./enhanced-message";
import type { Attachment } from "./types";

interface CanvasProps {
  messages: UIMessage[];
  status: "idle" | "streaming" | "submitted" | "error";
  isThread: boolean;
  chatId: string;
  annotationsByMessage: Record<string, SavedAnnotation[]>;
  onStartThread: (messageId: string, selectedText?: string) => void;
  onAskLucinova: (messageId: string, selectedText: string) => void;
  onOpenAnnotation: (annotationId: string, selectedText: string) => void;
  setInput: (value: string) => void;
  selectedText?: string;
  // Input props (only used for thread mode)
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
  onEditMessage?: (messageId: string, newText: string) => void;
  onRegenerate?: () => void;
}

export function Canvas({
  messages,
  status,
  isThread,
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
  onEditMessage,
  onRegenerate,
}: CanvasProps) {
  const [messagesContainerRef, messagesEndRef] =
    useScrollToBottom<HTMLDivElement>();

  // Find last user/assistant messages for edit/regenerate actions
  const lastUserMessageId = useMemo(
    () => [...messages].reverse().find((m) => m.role === "user")?.id,
    [messages]
  );
  const lastAssistantMessageId = useMemo(
    () => [...messages].reverse().find((m) => m.role === "assistant")?.id,
    [messages]
  );

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
              ) : null}
            </div>
          </div>
        ) : messages.length === 0 && !isThread ? (
          <div className="relative flex items-center justify-center h-full p-8 overflow-hidden">
            {/* Layer 0: Dot placement hints */}
            <div className="absolute inset-0 pointer-events-none hidden md:block" aria-hidden="true">
              {[
                { top: "12%", left: "15%" },
                { top: "22%", right: "18%" },
                { bottom: "28%", left: "22%" },
                { bottom: "15%", right: "12%" },
                { top: "45%", left: "8%" },
                { top: "35%", right: "8%" },
              ].map((pos, i) => (
                <div
                  key={i}
                  className="absolute size-2 rounded-full bg-primary/15 dark:bg-primary/10"
                  style={{
                    ...pos,
                    animation: `canvas-fade-in-up 600ms ease-out ${800 + i * 100}ms forwards`,
                    opacity: 0,
                  }}
                />
              ))}
            </div>

            {/* Layer 1: Floating pin cards + connector lines */}
            <div className="absolute inset-0 pointer-events-none hidden md:block" aria-hidden="true">
              {[
                { label: "Ideas", icon: <Sparkles className="size-4" />, position: { top: "14%", left: "12%" }, rotation: "-3deg", floatDuration: "6s", animDelay: "0s" },
                { label: "Threads", icon: <Reply className="size-4" />, position: { top: "18%", right: "14%" }, rotation: "2deg", floatDuration: "7s", animDelay: "1.5s" },
                { label: "Notes", icon: <MessageSquare className="size-4" />, position: { bottom: "22%", left: "16%" }, rotation: "2.5deg", floatDuration: "8s", animDelay: "0.8s" },
                { label: "Code", icon: <FileCode className="size-4" />, position: { bottom: "16%", right: "10%" }, rotation: "-2deg", floatDuration: "6.5s", animDelay: "2s" },
              ].map((card, i) => (
                <div
                  key={card.label}
                  className="absolute flex items-center gap-2 px-3 py-2 rounded-lg border border-border/60 bg-card/80 dark:bg-card/60 backdrop-blur-sm shadow-sm text-muted-foreground"
                  style={{
                    ...card.position,
                    transform: `rotate(${card.rotation})`,
                    animation: `canvas-fade-in-up 600ms ease-out ${200 + i * 150}ms forwards, canvas-float ${card.floatDuration} ease-in-out ${card.animDelay} infinite`,
                    opacity: 0,
                  }}
                >
                  {card.icon}
                  <span className="text-xs font-medium">{card.label}</span>
                </div>
              ))}

              {/* Dashed connector lines */}
              <svg className="absolute inset-0 size-full" viewBox="0 0 100 100" preserveAspectRatio="none" fill="none">
                <path
                  d="M 18 20 Q 35 35 50 50"
                  stroke="hsl(var(--primary))"
                  strokeWidth="0.15"
                  strokeDasharray="2 2"
                  strokeLinecap="round"
                  opacity="0.25"
                  style={{ strokeDashoffset: 200, animation: "canvas-draw-line 800ms ease-in-out 1s forwards" }}
                />
                <path
                  d="M 82 22 Q 70 40 55 48"
                  stroke="hsl(var(--primary))"
                  strokeWidth="0.15"
                  strokeDasharray="2 2"
                  strokeLinecap="round"
                  opacity="0.2"
                  style={{ strokeDashoffset: 200, animation: "canvas-draw-line 800ms ease-in-out 1.3s forwards" }}
                />
              </svg>
            </div>

            {/* Layer 2: Center content */}
            <div
              className="relative z-20 text-center max-w-md"
              style={{ animation: "canvas-fade-in-up 600ms ease-out 100ms forwards", opacity: 0 }}
            >
              <div className="size-16 mx-auto mb-4 rounded-xl flex items-center justify-center">
                <Image src="/images/lucidity-logo.svg" alt="Lucidity" width={64} height={64} className="size-full object-contain" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Lucidity Canvas</h2>
              <p className="text-muted-foreground mb-6">Your thinking space. Ask questions, explore ideas, branch into threads.</p>
              <div className="flex flex-col gap-2 mb-4">
                {[
                  { label: "Explain a complex concept simply", value: "Explain a complex concept to me" },
                  { label: "Create a personalized study plan", value: "Help me create a study plan for a new subject" },
                  { label: "Summarize and extract key points", value: "Summarize this text and extract key learning points" },
                ].map((suggestion, i) => (
                  <button
                    key={suggestion.value}
                    onClick={() => setInput(suggestion.value)}
                    className="p-3 text-left rounded-lg border border-border hover:bg-muted transition-colors"
                    style={{ animation: `canvas-fade-in-up 500ms ease-out ${400 + i * 100}ms forwards`, opacity: 0 }}
                  >
                    <p className="text-sm text-foreground/80">{suggestion.label}</p>
                  </button>
                ))}
              </div>
              <div className="text-xs text-muted-foreground hidden lg:block">
                Start a conversation in the sidebar →
              </div>
              <div className="text-xs text-muted-foreground lg:hidden">
                Type your message below to start
              </div>
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
                  onEditMessage={onEditMessage}
                  onRegenerate={onRegenerate}
                  isLastUserMessage={message.role === "user" && message.id === lastUserMessageId}
                  isLastAssistantMessage={message.role === "assistant" && message.id === lastAssistantMessageId}
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

      {/* Input - only for threads (main chat uses bottom panel on mobile / right sidebar on desktop) */}
      {isThread && (
        <div className="border-t border-border p-3 sm:p-4 shrink-0">
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
      )}
    </div>
  );
}
