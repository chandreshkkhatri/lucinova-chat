"use client";

import { X, MessageSquareText, Trash2 } from "lucide-react";
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
  // so the Chat component's useGoogleChat will include it and auto-send
  const effectiveInitialMessages =
    !isLoading && initialMessage && threadMessages.length === 0 && !initialMessageSentRef.current
      ? [] // Start empty — the Chat component will handle sending via selectedText context
      : threadMessages;

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
          <div className="text-sm italic text-foreground/80 bg-card rounded-lg px-4 py-2 border-l-4 border-purple-400 dark:border-purple-500 max-h-24 overflow-y-auto">
            {'"'}
            {selectedText}
            {'"'}
          </div>
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

