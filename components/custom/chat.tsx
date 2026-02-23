"use client";

import { MessageSquare, Grid, Sparkles } from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useRef } from "react";
import useSWR, { mutate as globalMutate } from "swr";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGoogleChat } from "@/hooks/use-google-chat";
import { Message } from "@/lib/chat-utils";
import { DEMO_ANNOTATIONS, DEMO_MESSAGES } from "@/lib/demo-data";

const Canvas = dynamic(() => import("./canvas").then((mod) => mod.Canvas), {
  loading: () => (
    <div className="flex items-center justify-center size-full text-muted-foreground">
      Loading Canvas...
    </div>
  ),
  ssr: false, // Canvas uses window/DOM APIs heavily
});

import { ChatList } from "./chat-list";
import { SavedAnnotation } from "./enhanced-message";
import { RightSidebar } from "./right-sidebar";
import { useSidebar } from "./sidebar-context";
import { useTour } from "./tour-provider";
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

  const { isTourActive } = useTour();
  const isToggleEnabled =
    process.env.NEXT_PUBLIC_FEATURE_FLAG_CANVAS_CHAT_TOGGLE !== "false";

  const [viewMode, setViewMode] = useState<"chat" | "canvas">("chat"); 
  
  // Use demo data if tour is active and valid to show
  const showDemoData = isTourActive && !isThread;

  // When tour starts, ensure clean state (chat view, no threads)
  useEffect(() => {
    if (isTourActive) {
      setViewMode("chat");
      setActiveThread(null);
      setActiveAnnotation(null);
      setPendingAnnotation(null);
    }
  }, [isTourActive]);

  const { messages, sendMessage, status, stop, setMessages, regenerate, editMessage } =
    useGoogleChat({
      id: chatSessionId,
      api: apiOverride || (isThread ? "/api/thread" : "/api/chat"),
      initialMessages: initialMessages,
      body: {
        id: chatIdForSubmit,
        modelId: selectedModel,
        ...(selectedProjectId && { projectId: selectedProjectId }),
        ...(isThread && { parentMessageId, mainChatId, selectedText }),
      },
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

  // Wrap sendMessage to always include the body options (id, modelId, etc.)
  // so every code path (text, audio, file) sends chatId to the API.
  const sendMessageWithBody = useCallback(
    (
      message: { text?: string; content?: string; files?: any[]; role?: "user" },
      options?: { body?: any },
    ) =>
      sendMessage(message, {
        ...options,
        body: {
          id: chatIdForSubmit,
          modelId: selectedModel,
          ...(selectedProjectId && { projectId: selectedProjectId }),
          ...(isThread && { parentMessageId, mainChatId, selectedText }),
          ...options?.body,
        },
      }),
    [sendMessage, chatIdForSubmit, selectedModel, selectedProjectId, isThread, parentMessageId, mainChatId, selectedText],
  );

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

    sendMessageWithBody({
      text: input,
      files: fileParts,
    });

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
    isLoading?: boolean;
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
    async (messageId: string, selectedText: string) => {
      // 1. Trigger the sidebar to open immediately in a loading state
      setPendingAnnotation({ messageId, selectedText, isLoading: true });
      setActiveThread(null);
      setActiveAnnotation(null);

      // 2. Create the annotation instantly in the background
      try {
        const res = await fetch("/api/annotations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messageId,
            chatId: id,
            selectedText,
          }),
        });

        if (!res.ok) throw new Error("Failed to create annotation");

        const { annotation } = await res.json();

        mutateAnnotations();

        // 3. Mount the actual AnnotationThreadView
        setActiveAnnotation({
          id: annotation.id,
          selectedText: annotation.selectedText,
        });
        setPendingAnnotation(null);
      } catch (error) {
        console.error("Failed to create annotation:", error);
        setPendingAnnotation(null);
      }
    },
    [id, mutateAnnotations],
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

  // handleCreateAnnotation is removed as annotations are created instantly on click

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

  // Use demo data when tour is active and chat is empty
  const effectiveMessages = showDemoData ? DEMO_MESSAGES : messages;
  const effectiveAnnotations = showDemoData ? DEMO_ANNOTATIONS : annotationsByMessage;

  // Shared props
  const sharedProps = {
    messages: effectiveMessages,
    status: status as "idle" | "streaming" | "submitted" | "error",
    chatId: id,
    annotationsByMessage: effectiveAnnotations,
    onStartThread: handleStartThread,
    onAskLucinova: handleAskLucinova,
    onOpenAnnotation: handleOpenAnnotation,
    setInput,
    input,
    handleSubmit,
    stop,
    attachments,
    setAttachments,
    sendMessage: sendMessageWithBody,
    isGuest,
    usageLimitInfo,
    onRegenerate: handleRegenerate,
    onEditMessage: editMessage,
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
      {/* Main Content Area */}
      <div className="flex flex-1 min-w-0 h-full relative z-0">
        <div className="flex-1 flex flex-col min-w-0 h-full">
          
          {/* View Toggle - Centered at top */}
          {isToggleEnabled && (
            <div className="flex items-center justify-center py-2 absolute inset-x-0 top-0 z-20 pointer-events-none">
               <Tabs
                id="view-toggle"
                value={viewMode}
                onValueChange={(v) => setViewMode(v as any)}
                className="w-auto pointer-events-auto"
              >
                <TabsList className="grid w-full grid-cols-2 h-8 p-1 gap-1 bg-muted/80 backdrop-blur-sm shadow-sm">
                  <TabsTrigger value="chat" className="text-xs px-3 py-1 bg-transparent data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    <MessageSquare className="size-3.5 mr-1.5" />
                    Chat
                  </TabsTrigger>
                  <TabsTrigger value="canvas" className="text-xs px-3 py-1 bg-transparent data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    <Grid className="size-3.5 mr-1.5" />
                    Canvas
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          )}

          <div className="flex-1 h-full overflow-hidden relative">
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
              onAnnotationDeleted={handleAnnotationDeleted}
              isMounted={true}
            />
          </div>
        )}
      </div>
    </div>
  );
}
