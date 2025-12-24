import { X, MessageSquare, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Chat } from "./chat";
import { UIMessage as Message } from "ai";
import { useState, useEffect } from "react";
import { mutate as revalidateSWR } from "swr";

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
  const [threadMessages, setThreadMessages] = useState<Message[]>([]);

  const handleNewReply = () => {
    revalidateSWR(
      `/api/threads/count?parentMessageId=${parentMessage.id}&mainChatId=${mainChatId}`
    );
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

  // Load existing replies for this thread only if no selected text
  useEffect(() => {
    // If there's selected text, we want a fresh thread
    if (selectedText) {
      setThreadMessages([]);
      return;
    }

    async function loadThread() {
      try {
        const res = await fetch(
          `/api/threads?parentMessageId=${parentMessage.id}&mainChatId=${mainChatId}`
        );
        if (!res.ok) return;
        const { threads } = await res.json();
        setThreadMessages(threads);
      } catch {
        // ignore errors
      }
    }
    loadThread();
  }, [parentMessage.id, mainChatId, selectedText]);

  return (
    <div
      className={`flex flex-col bg-gray-50 dark:bg-gray-950 h-full max-h-full overflow-hidden ${className}`}
    >
      {/* Thread Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">
              Thread
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {selectedText ? "Ask about selected text" : "Replying to message"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDeleteThread}
            className="rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
            title="Delete Thread"
          >
            <Trash className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Selected Text Display (if present) */}
      {selectedText && (
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center justify-center">
            <div className="text-sm italic text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-2 max-w-2xl">
              "{selectedText}"
            </div>
          </div>
        </div>
      )}

      {/* Thread Separator */}
      {!selectedText && (
        <div className="px-4 py-2 bg-gradient-to-b from-gray-100 to-gray-50 dark:from-gray-900 dark:to-gray-950 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-700 to-transparent"></div>
            <span className="text-xs text-gray-500 dark:text-gray-400 px-2">
              Thread Replies
            </span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-700 to-transparent"></div>
          </div>
        </div>
      )}

      {/* Thread Chat */}
      <div className="min-h-0 flex-grow bg-white dark:bg-gray-900">
        <Chat
          id={mainChatId}
          initialMessages={threadMessages}
          isThread={true}
          parentMessageId={parentMessage.id}
          mainChatId={mainChatId}
          className="h-full max-h-full flex flex-col"
          onFinish={handleNewReply}
          selectedText={selectedText}
          defaultModelId={modelId}
        />
      </div>
    </div>
  );
}
