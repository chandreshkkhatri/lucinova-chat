"use client";

import { X, MessageSquareText, Trash2, Copy, Check } from "lucide-react";
import { useState, useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Message } from "@/lib/chat-utils";

import { Chat } from "./chat";

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
  const [threadMessages, setThreadMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const initialMessageSentRef = useRef(false);

  // Load existing messages for this annotation
  useEffect(() => {
    async function loadMessages() {
      try {
        const res = await fetch(`/api/annotations/${annotationId}`);
        if (!res.ok) return;
        const data = await res.json();
        const loaded: Message[] = (data.messages || []).map((m: any) => ({
          id: m.id || m._id,
          role: m.role,
          content: m.content || m.body || "",
          createdAt: m.createdAt,
          parts: m.parts || [{ type: "text", text: m.content || m.body || "" }],
        }));
        setThreadMessages(loaded);
      } catch {
        // ignore errors
      } finally {
        setIsLoading(false);
      }
    }
    loadMessages();
  }, [annotationId]);

  // If there's an initial message and no existing messages, seed it as the first user message
  const effectiveInitialMessages =
    !isLoading && initialMessage && threadMessages.length === 0 && !initialMessageSentRef.current
      ? [{
          id: `temp-${Date.now()}`,
          role: "user" as const,
          content: initialMessage,
          createdAt: new Date(),
          parts: [{ type: "text" as const, text: initialMessage }]
        }]
      : threadMessages;

  useEffect(() => {
    // If we haven't sent the initial message and we have one, flag it as sent so we
    // don't keep overriding the messages array with the temp message
    if (!isLoading && initialMessage && threadMessages.length === 0 && !initialMessageSentRef.current) {
        // Find the form element within the Chat component and submit it
        const timer = setTimeout(() => {
           initialMessageSentRef.current = true;
           const form = document.querySelector(`form[id="chat-form-${chatId}"]`) as HTMLFormElement;
           if (form) {
               // We need to inject the initialMessage into the Chat's internal state
               // Since we can't do that directly, we simulate input and submission
               const textarea = form.querySelector('textarea') as HTMLTextAreaElement;
               if (textarea) {
                   // Actually use React setter to update value if possible, or just submit
                   // We're passing it via effectiveInitialMessages, but it needs to trigger the AI
                   // Let's fire a custom event or click the submit button
                   const submitBtn = form.querySelector('button[type="submit"]') as HTMLButtonElement;
                   if (submitBtn && !submitBtn.disabled) {
                       submitBtn.click();
                   }
               }
           }
        }, 500);
        return () => clearTimeout(timer);
    }
  }, [isLoading, initialMessage, threadMessages.length, chatId]);

  const [copied, setCopied] = useState(false);

  const handleCopySelectedText = async () => {
    if (!selectedText) return;
    try {
      await navigator.clipboard.writeText(selectedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

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

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center h-full bg-secondary ${className}`}>
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

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
          <div className="flex-1 text-sm italic text-foreground/80 bg-card rounded-lg px-4 py-2 border-l-4 border-purple-400 dark:border-purple-500 max-h-24 overflow-y-auto">
            {'"'}
            {selectedText}
            {'"'}
          </div>
          <button
            onClick={handleCopySelectedText}
            className="shrink-0 p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors mt-0.5"
            title="Copy selected text"
          >
            {copied ? <Check className="size-4 text-green-500" /> : <Copy className="size-4" />}
          </button>
        </div>
      </div>

      {/* Chat (same component as Reply threads) */}
      <div className="min-h-0 grow bg-card">
        <Chat
          id={chatId}
          initialMessages={effectiveInitialMessages}
          isThread={true}
          parentMessageId={annotationId}
          mainChatId={chatId}
          className="h-full max-h-full bg-card"
          selectedText={initialMessage && threadMessages.length === 0 ? initialMessage : undefined}
          defaultModelId={modelId}
          api={`/api/annotations/${annotationId}/chat`}
        />
      </div>
    </div>
  );
}

