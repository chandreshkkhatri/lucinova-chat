"use client";

import { MessageSquare, Grid, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useRef } from "react";
import useSWR, { mutate as globalMutate } from "swr";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGoogleChat } from "@/hooks/use-google-chat";
import { Message } from "@/lib/chat-utils";

import { Canvas } from "./canvas";
import { ChatList } from "./chat-list";
import { SavedAnnotation } from "./enhanced-message";
import { RightSidebar } from "./right-sidebar";
import { useSidebar } from "./sidebar-context";
import { Attachment } from "./types";
import type { NodeType } from "@/lib/message-to-nodes";

// Fetcher for SWR
const fetcher = (url: string) => fetch(url).then((res) => res.json());

const DEFAULT_BOTTOM_PANEL = 300;
const COLLAPSED_BOTTOM_PANEL = 120;

export function Chat({
  id,
  initialMessages,
  isThread = false,
  parentMessageId,
  mainChatId,
  className = "",
  onFinish,
  isUserPro = false,
  isGuest = false,
  selectedText,
  defaultModelId = "gemini-3-flash-preview",
  api: apiOverride,
}: {
  id: string;
  initialMessages: Array<Message>;
  isThread?: boolean;
  parentMessageId?: string;
  mainChatId?: string;
  className?: string;
  onFinish?: () => void;
  isUserPro?: boolean;
  isGuest?: boolean;
  selectedText?: string;
  defaultModelId?: string;
  api?: string;
}) {
  const router = useRouter();
  // chatIdForSubmit = the real MongoDB chat ID, sent in the API body.
  const chatIdForSubmit = isThread ? mainChatId! : id;
  // chatSessionId = unique ID for the useChat hook's internal state.
  // Threads MUST have a different ID than the main chat to prevent
  // message state from leaking between them (useChat shares state by id).
  const chatSessionId = isThread ? `thread-${parentMessageId}` : id;

  const { selectedProjectId } = useSidebar();

  // Model selection state
  const [selectedModel, setSelectedModel] = useState<string>(defaultModelId);
  const [input, setInput] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);

  // Usage limit state
  const [usageLimitInfo, setUsageLimitInfo] = useState<{
    exceeded: boolean;
    isPro: boolean;
    currentUsage: number;
    limit: number;
    periodEnd: Date | string;
  } | null>(null);

  // Feature Flag & View Mode Check
  const isToggleEnabled =
    process.env.NEXT_PUBLIC_FEATURE_FLAG_CANVAS_CHAT_TOGGLE !== "false";

  const [viewMode, setViewMode] = useState<"chat" | "canvas">("chat");

  const { messages, sendMessage, status, stop, setMessages, regenerate } =
    useGoogleChat({
      id: chatSessionId,
      api: apiOverride || (isThread ? "/api/thread" : "/api/chat"),
      initialMessages: initialMessages,
      onFinish: (message) => {
        const url = `/chat/${chatIdForSubmit}`;
        if (!isThread) {
          window.history.replaceState({}, "", url);
        }
        onFinish?.();

        // Refresh messages to sync real server IDs (replacing temp IDs)
        // Skip for guests — sync endpoints require auth and would return 401
        if (!isGuest) {
          const syncMessages = async () => {
            try {
              if (isThread) {
                const res = await fetch(
                  `/api/threads?parentMessageId=${parentMessageId}&mainChatId=${mainChatId}`
                );
                if (res.ok) {
                  const data = await res.json();
                  if (data.threads) {
                    setMessages(data.threads);
                  }
                }
              } else {
                const res = await fetch(`/api/chat/${chatIdForSubmit}`);
                if (res.ok) {
                  const data = await res.json();
                  if (data.messages) {
                    setMessages(data.messages);
                  }
                }
              }
            } catch (error) {
              console.error("Failed to sync messages:", error);
            }
          };
          syncMessages();
        }

        // Revalidate history cache to pick up server-generated title
        setTimeout(() => {
          globalMutate("/api/history");
        }, 3000);
      },
      onError: (error: any) => {
        console.error("Chat error:", error);
        try {
          const errorText = error.message || "";
          if (
            errorText.includes("usage_limit_exceeded") ||
            errorText.includes("429")
          ) {
            fetch("/api/usage")
              .then((res) => res.json())
              .then((usageData) => {
                if (usageData.current) {
                  setUsageLimitInfo({
                    exceeded: true,
                    isPro: usageData.isPro,
                    currentUsage: usageData.current.unitsUsed,
                    limit: usageData.current.limit,
                    periodEnd: usageData.current.periodEnd,
                  });
                }
              })
              .catch(() => {
                setUsageLimitInfo({
                  exceeded: true,
                  isPro: isUserPro,
                  currentUsage: 0,
                  limit: 0,
                  periodEnd: new Date(),
                });
              });
          }
        } catch {
          // Ignore parsing errors
        }
      },
    });

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() && attachments.length === 0) return;

    if (!isGuest) {
      try {
        const checkRes = await fetch("/api/usage");
        if (checkRes.ok) {
          const usageData = await checkRes.json();
          if (usageData.current.percentUsed > 100) {
            setUsageLimitInfo({
              exceeded: true,
              isPro: usageData.isPro,
              currentUsage: usageData.current.unitsUsed,
              limit: usageData.current.limit,
              periodEnd: usageData.current.periodEnd,
            });
            return;
          }
        }
      } catch (err) {
        console.error("Usage check failed:", err);
      }
    }

    // Attachments are passed directly; useGoogleChat handles them
    const fileParts: any[] = attachments.map((a) => ({
      name: a.name,
      contentType: a.contentType,
      url: a.url,
    }));

    sendMessage(
      {
        text: input,
        files: fileParts,
      },
      {
        body: {
          id: chatIdForSubmit,
          modelId: selectedModel,
          ...(selectedProjectId && { projectId: selectedProjectId }),
          ...(isThread && { parentMessageId, mainChatId, selectedText }),
        },
      },
    );

    setInput("");
    setAttachments([]);
  };

  useEffect(() => {
    if (messages.length === 0 && initialMessages.length > 0) {
      setMessages(initialMessages);
    }
  }, [initialMessages, messages.length, setMessages]);

  const [attachments, setAttachments] = useState<Attachment[]>([]);

  // Reply thread state
  const [activeThread, setActiveThread] = useState<{
    parentMessage: Message;
    selectedText?: string;
  } | null>(null);

  // Update activeThread message when messages change (e.g. after sync)
  useEffect(() => {
    if (activeThread) {
      const updatedMessage = messages.find(
        (m: any) =>
          m.id === activeThread.parentMessage.id ||
          (m.content === (activeThread.parentMessage as any).content &&
            m.role === (activeThread.parentMessage as any).role &&
            Math.abs(
              new Date(m.createdAt || 0).getTime() -
                new Date((activeThread.parentMessage as any).createdAt || 0).getTime()
            ) < 5000)
      );
      if (
        updatedMessage &&
        updatedMessage.id !== activeThread.parentMessage.id
      ) {
        setActiveThread((prev) =>
          prev ? { ...prev, parentMessage: updatedMessage } : null
        );
      }
    }
  }, [messages, activeThread]);

  // Annotation (Ask Lucinova) thread state
  const [activeAnnotation, setActiveAnnotation] = useState<{
    id: string;
    selectedText: string;
    initialMessage?: string;
  } | null>(null);

  // Pending annotation
  const [pendingAnnotation, setPendingAnnotation] = useState<{
    messageId: string;
    selectedText: string;
    initialMessage?: string;
  } | null>(null);

  // Fetch annotations for this chat
  const { data: annotationsData, mutate: mutateAnnotations } = useSWR(
    !isThread ? `/api/annotations?chatId=${id}` : null,
    fetcher,
  );

  const annotations: SavedAnnotation[] = annotationsData?.annotations || [];

  const annotationsByMessage = annotations.reduce(
    (acc, ann) => {
      if (!acc[ann.messageId]) {
        acc[ann.messageId] = [];
      }
      acc[ann.messageId].push(ann);
      return acc;
    },
    {} as Record<string, SavedAnnotation[]>,
  );

  const handleStartThread = (messageId: string, selectedText?: string) => {
    const parentMessage = messages.find((msg) => msg.id === messageId);
    if (parentMessage && !isThread) {
      setActiveThread({
        parentMessage: parentMessage,
        selectedText,
      });
      setActiveAnnotation(null);
      setPendingAnnotation(null);
    }
  };

  const handleCloseThread = () => {
    setActiveThread(null);
    if (!isThread) {
      router.push(`/chat/${id}`);
    }
  };

  const handleAskLucinova = useCallback(
    (messageId: string, selectedText: string) => {
      setPendingAnnotation({ messageId, selectedText });
      setActiveThread(null);
      setActiveAnnotation(null);
    },
    [],
  );

  const handleOpenAnnotation = useCallback(
    (annotationId: string, selectedText: string) => {
      setActiveAnnotation({ id: annotationId, selectedText });
      setActiveThread(null);
      setPendingAnnotation(null);
    },
    [],
  );

  const handleCloseAnnotation = () => {
    setActiveAnnotation(null);
    setPendingAnnotation(null);
  };

  const handleAnnotationDeleted = () => {
    mutateAnnotations();
  };

  const handleCreateAnnotation = async (firstMessage: string) => {
    if (!pendingAnnotation) return null;

    try {
      const res = await fetch("/api/annotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageId: pendingAnnotation.messageId,
          chatId: id,
          selectedText: pendingAnnotation.selectedText,
          firstMessage,
        }),
      });

      if (!res.ok) throw new Error("Failed to create annotation");

      const { annotation } = await res.json();

      mutateAnnotations();

      setActiveAnnotation({
        id: annotation.id,
        selectedText: annotation.selectedText,
        initialMessage: firstMessage,
      });
      setPendingAnnotation(null);

      return annotation.id;
    } catch (error) {
      console.error("Failed to create annotation:", error);
      return null;
    }
  };

  const handleAnnotationCreated = useCallback(
    (annotationId: string, selectedText: string) => {
      setActiveAnnotation({ id: annotationId, selectedText });
      setPendingAnnotation(null);
      mutateAnnotations();
    },
    [mutateAnnotations],
  );

  const handleEditMessage = useCallback(
    (messageId: string, newText: string) => {
      const msgIndex = messages.findIndex((m) => m.id === messageId);
      if (msgIndex === -1) return;

      // Optimistic update
      setMessages((prev) => {
        const updated = [...prev];
        updated[msgIndex] = {
            ...updated[msgIndex],
            content: newText,
            parts: [{ type: "text" as const, text: newText }]
        } as any;
        return updated.slice(0, msgIndex + 1);
      });

      regenerate();
    },
    [messages, setMessages, regenerate],
  );

  const handleRegenerate = useCallback(() => {
    regenerate();
  }, [regenerate]);

  // Shared props
  const sharedProps = {
    messages: messages,
    status: status as "idle" | "streaming" | "submitted" | "error",
    chatId: id,
    annotationsByMessage,
    onStartThread: handleStartThread,
    onAskLucinova: handleAskLucinova,
    onOpenAnnotation: handleOpenAnnotation,
    setInput,
    input,
    handleSubmit,
    stop,
    attachments,
    setAttachments,
    sendMessage,
    isGuest,
    usageLimitInfo,
    onRegenerate: handleRegenerate,
    selectedModel,
    setSelectedModel,
    isUserPro,
  };

  if (isThread) {
    return (
      <div
        ref={containerRef}
        className={`flex h-full bg-paper ${className} max-h-full overflow-hidden`}
      >
        <div className="flex-1 flex flex-col min-w-0 h-full max-h-full overflow-hidden">
          <ChatList {...sharedProps} />
        </div>
      </div>
    );
  }

  const showMobileOverlay =
    activeThread || activeAnnotation || pendingAnnotation;

  return (
    <div ref={containerRef} className={`flex h-full bg-paper ${className}`}>
      {/* View Toggle */}
      {isToggleEnabled && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-background/80 backdrop-blur-sm rounded-lg border border-border shadow-sm p-1">
          <Tabs
            value={viewMode}
            onValueChange={(v) => setViewMode(v as any)}
            className="w-[180px]"
          >
            <TabsList className="grid w-full grid-cols-2 h-8">
              <TabsTrigger value="chat" className="text-xs">
                <MessageSquare className="size-3.5 mr-1.5" />
                Chat
              </TabsTrigger>
              <TabsTrigger value="canvas" className="text-xs">
                <Grid className="size-3.5 mr-1.5" />
                Canvas
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 min-w-0 h-full relative z-0">
        <div className="flex-1 flex flex-col min-w-0 h-full">
          <div className="flex-1 h-full">
            {isToggleEnabled && viewMode === "canvas" ? (
              <Canvas {...sharedProps} isThread={false} />
            ) : (
              <ChatList {...sharedProps} />
            )}
          </div>
        </div>

        {/* Right Sidebar - Thread/Annotation View */}
        {(activeThread || activeAnnotation || pendingAnnotation) && (
          <div className="w-[450px] border-l border-border bg-card/30 backdrop-blur-md shrink-0 hidden md:block">
            <RightSidebar
              {...sharedProps}
              activeThread={activeThread}
              activeAnnotation={activeAnnotation}
              pendingAnnotation={pendingAnnotation}
              onCloseThread={handleCloseThread}
              onCloseAnnotation={handleCloseAnnotation}
              onCreateAnnotation={handleCreateAnnotation}
              onAnnotationCreated={handleAnnotationCreated}
              onAnnotationDeleted={handleAnnotationDeleted}
              isMounted={true}
            />
          </div>
        )}

        {/* Mobile Sidebar Overlay */}
        {showMobileOverlay && (
          <div className="absolute inset-0 z-50 bg-background md:hidden">
            <RightSidebar
              {...sharedProps}
              activeThread={activeThread}
              activeAnnotation={activeAnnotation}
              pendingAnnotation={pendingAnnotation}
              onCloseThread={handleCloseThread}
              onCloseAnnotation={handleCloseAnnotation}
              onCreateAnnotation={handleCreateAnnotation}
              onAnnotationCreated={handleAnnotationCreated}
              onAnnotationDeleted={handleAnnotationDeleted}
              isMounted={true}
            />
          </div>
        )}
      </div>
    </div>
  );
}
