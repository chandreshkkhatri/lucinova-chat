import { X, MessageSquare, Trash, Copy, Check } from "lucide-react";
import { useState } from "react";
import useSWR, { mutate as revalidateSWR } from "swr";

import { Button } from "@/components/ui/button";
import { Message } from "@/lib/chat-utils";

import { Chat } from "./chat";

const threadFetcher = (url: string) =>
  fetch(url).then((r) => (r.ok ? r.json() : { threads: [] }));

interface ThreadViewProps {
  parentMessage: Message;
  selectedText?: string;
  mainChatId: string;
  onClose: () => void;
  className?: string;
  modelId?: string;
}

export function ThreadView({
  parentMessage,
  selectedText,
  mainChatId,
  onClose,
  className = "",
  modelId,
}: ThreadViewProps) {
  // Fetch existing replies – uses SWR so prefetched data is served instantly
  const { data: threadData } = useSWR(
    !selectedText
      ? `/api/threads?parentMessageId=${parentMessage.id}&mainChatId=${mainChatId}`
      : null,
    threadFetcher,
    { revalidateOnFocus: false }
  );
  const threadMessages: Message[] = threadData?.threads ?? [];

  const handleNewReply = () => {
    // Revalidate the single thread count (for this specific message)
    revalidateSWR(
      `/api/threads/count?parentMessageId=${parentMessage.id}&mainChatId=${mainChatId}`
    );
    // Revalidate the batch thread counts (for the main chat list)
    revalidateSWR(`/api/threads/counts?chatId=${mainChatId}`);
  };

  const [copied, setCopied] = useState(false);

  const handleCopySelectedText = async () => {
    if (!selectedText) return;
    try {
      await navigator.clipboard.writeText(selectedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleDeleteThread = async () => {
    if (
      confirm(
        "Are you sure you want to delete this thread? All messages in this thread will be removed."
      )
    ) {
      try {
        const res = await fetch(
          `/api/thread?parentMessageId=${parentMessage.id}`,
          {
            method: "DELETE",
          }
        );
        if (res.ok) {
          onClose();
          // Force revalidation of the thread count to update the UI
          handleNewReply();
        }
      } catch (error) {
        console.error("Failed to delete thread:", error);
      }
    }
  };

  return (
    <div
      className={`flex flex-col bg-secondary h-full max-h-full overflow-hidden ${className}`}
    >
      {/* Thread Header */}
      <div className="px-4 py-3 border-b border-border bg-card flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <MessageSquare className="size-4 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">
              Thread
            </h2>
            <p className="text-xs text-muted-foreground">
              {selectedText ? "Ask about selected text" : "Replying to message"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDeleteThread}
            className="rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-muted-foreground hover:text-red-600 dark:hover:text-red-400"
            title="Delete Thread"
          >
            <Trash className="size-4" />
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

      {/* Selected Text Display (if present) */}
      {selectedText && (
        <div className="px-4 py-3 bg-muted/50 border-b border-border shrink-0">
          <div className="flex items-center justify-center gap-2">
            <div className="text-sm italic text-foreground/80 bg-muted rounded-lg px-4 py-2 max-w-2xl">
              {'"'}{selectedText}{'"'}
            </div>
            <button
              onClick={handleCopySelectedText}
              className="shrink-0 p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title="Copy selected text"
            >
              {copied ? <Check className="size-4 text-green-500" /> : <Copy className="size-4" />}
            </button>
          </div>
        </div>
      )}

      {/* Thread Separator */}
      {!selectedText && (
        <div className="px-4 py-2 bg-gradient-to-b from-muted to-secondary shrink-0">
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent"></div>
            <span className="text-xs text-muted-foreground px-2">
              Thread Replies
            </span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent"></div>
          </div>
        </div>
      )}

      {/* Thread Chat */}
      <div className="min-h-0 grow bg-card">
        <Chat
          id={mainChatId}
          initialMessages={threadMessages}
          isThread={true}
          parentMessageId={parentMessage.id}
          mainChatId={mainChatId}
          className="h-full max-h-full bg-card"
          onFinish={handleNewReply}
          selectedText={selectedText}
          defaultModelId={modelId}
        />
      </div>
    </div>
  );
}
