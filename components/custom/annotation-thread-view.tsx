"use client";

import { useGoogleChat } from "@/hooks/use-google-chat";
import { Message } from "@/lib/chat-utils";
import { X, MessageSquareText, Trash2, Sparkles } from "lucide-react";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

import { Markdown } from "./markdown";
import { MultimodalInput } from "./multimodal-input";

interface AnnotationThreadViewProps {
  annotationId: string;
  selectedText: string;
  initialMessage?: string;
  chatId: string;
  onClose: () => void;
  onDelete?: () => void;
  className?: string;
  modelId?: string;
}

export function AnnotationThreadView({
  annotationId,
  selectedText,
  initialMessage,
  chatId,
  onClose,
  onDelete,
  className = "",
  modelId,
}: AnnotationThreadViewProps) {
  const [initialMessages, setInitialMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initialMessageSentRef = useRef(false);

  const [input, setInput] = useState("");

  const { messages, sendMessage, status, stop, setMessages } = useGoogleChat({
    id: annotationId,
    api: `/api/annotations/${annotationId}/chat`,
    initialMessages: initialMessages,
  });

  // Load existing messages for this annotation and hydrate the chat state
  useEffect(() => {
    async function loadMessages() {
      try {
        const res = await fetch(`/api/annotations/${annotationId}`);
        if (!res.ok) return;
        const data = await res.json();
        const loaded = data.messages || [];
        setInitialMessages(loaded);
        // Seed the chat state
        if (loaded.length > 0) {
            setMessages((prev) => (prev.length > 0 ? prev : loaded));
        }
      } catch {
        // ignore errors
      } finally {
        setIsLoading(false);
      }
    }
    loadMessages();
  }, [annotationId, setMessages]);

  // Auto-send the initial message
  useEffect(() => {
    if (!isLoading && initialMessage && !initialMessageSentRef.current) {
      initialMessageSentRef.current = true;
      sendMessage({ text: initialMessage }, { body: { modelId } });
    }
  }, [isLoading, initialMessage, sendMessage, modelId]);

  const isChatLoading = status === "submitted" || status === "streaming";

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;
    sendMessage(
      { text: input },
      {
        body: {
          modelId,
        },
      },
    );
    setInput("");
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleDelete = async () => {
    if (
      confirm(
        "Are you sure you want to delete this annotation? All messages will be removed.",
      )
    ) {
      try {
        const res = await fetch(`/api/annotations/${annotationId}`, {
          method: "DELETE",
        });
        if (res.ok) {
          onDelete?.();
          onClose();
        }
      } catch (error) {
        console.error("Failed to delete annotation:", error);
      }
    }
  };

  return (
    <div
      className={`flex flex-col bg-secondary h-full max-h-full overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-border bg-card flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
            <MessageSquareText className="size-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">Ask Lucinova</h2>
            <p className="text-xs text-muted-foreground">About selected text</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            className="rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-muted-foreground hover:text-red-600 dark:hover:text-red-400"
            title="Delete Annotation"
          >
            <Trash2 className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="rounded-lg hover:bg-muted"
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>

      {/* Selected Text Display */}
      <div className="px-4 py-3 bg-purple-50 dark:bg-purple-900/20 border-b border-purple-100 dark:border-purple-800/30 shrink-0">
        <div className="flex items-start gap-2">
          <div className="text-sm italic text-foreground/80 bg-card rounded-lg px-4 py-2 border-l-4 border-purple-400 dark:border-purple-500 max-h-24 overflow-y-auto">
            {'"'}
            {selectedText}
            {'"'}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto min-h-0 bg-card">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full p-8">
            <div className="text-center max-w-md">
              <div className="size-12 mx-auto mb-4 rounded-xl bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800 flex items-center justify-center">
                <Sparkles className="size-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Ask about this text
              </h3>
              <p className="text-muted-foreground mb-6 text-sm">
                What would you like to know about the selected text?
              </p>

              {/* Quick suggestions */}
              <div className="flex flex-col gap-2 mb-4">
                <button
                  onClick={() =>
                    setInput("Can you explain this in simpler terms?")
                  }
                  className="p-3 text-left rounded-lg border border-border hover:bg-muted transition-colors"
                >
                  <p className="text-sm text-foreground/80">
                    Explain this in simpler terms
                  </p>
                </button>

                <button
                  onClick={() => setInput("What are the key points here?")}
                  className="p-3 text-left rounded-lg border border-border hover:bg-muted transition-colors"
                >
                  <p className="text-sm text-foreground/80">
                    What are the key points?
                  </p>
                </button>

                <button
                  onClick={() => setInput("Can you give me an example?")}
                  className="p-3 text-left rounded-lg border border-border hover:bg-muted transition-colors"
                >
                  <p className="text-sm text-foreground/80">
                    Give me an example
                  </p>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-2 p-2 sm:p-3 ${
                  message.role === "user" ? "justify-end" : ""
                }`}
              >
                {message.role === "assistant" && (
                  <Avatar className="size-8 shrink-0">
                    <AvatarFallback className="bg-transparent p-0.5">
                      <Image
                        src="/images/lucidity-logo.svg"
                        alt="Lucinova"
                        width={28}
                        height={28}
                        quality={90}
                        className="size-full object-contain"
                      />
                    </AvatarFallback>
                  </Avatar>
                )}

                <div
                  className={`flex-1 max-w-[90%] sm:max-w-[85%] ${
                    message.role === "user" ? "text-right" : ""
                  }`}
                >
                  <div
                    className={`inline-block ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-3 py-2"
                        : "bg-muted rounded-2xl rounded-tl-sm px-3 py-2"
                    }`}
                  >
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <Markdown>
                        {(message as any).parts
                          ? (message as any).parts
                              .filter((p: any) => p.type === "text")
                              .map((p: any) => p.text)
                              .join("")
                          : (message as any).content || ""}
                      </Markdown>
                    </div>
                  </div>
                </div>

                {message.role === "user" && (
                  <Avatar className="size-8 shrink-0">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                      U
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}

            {isChatLoading && (
              <div className="p-3">
                <div className="flex items-center gap-2">
                  <Avatar className="size-8 shrink-0">
                    <AvatarFallback className="bg-transparent p-0.5">
                      <Image
                        src="/images/lucidity-logo.svg"
                        alt="Lucinova"
                        width={28}
                        height={28}
                        className="size-full object-contain"
                      />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-muted rounded-2xl rounded-tl-sm px-3 py-2">
                    <div className="typing-indicator flex gap-1">
                      <span className="size-2 bg-muted-foreground rounded-full animate-bounce"></span>
                      <span
                        className="size-2 bg-muted-foreground rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></span>
                      <span
                        className="size-2 bg-muted-foreground rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        <div
          ref={messagesEndRef}
          className="shrink-0 min-w-[24px] min-h-[24px]"
        />
      </div>

      {/* Input */}
      <div className="border-t border-border p-3 sm:p-4 shrink-0 bg-card">
        <MultimodalInput
          input={input}
          setInput={setInput}
          isLoading={isChatLoading}
          stop={stop}
          attachments={[]}
          setAttachments={() => {}}
          messages={messages}
          sendMessage={sendMessage}
          handleSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}
