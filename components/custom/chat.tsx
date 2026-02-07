"use client";

import { useChat } from "@ai-sdk/react";
import { TextStreamChatTransport, UIMessage } from "ai";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useRef } from "react";
import useSWR from "swr";

import type { NodeType } from "@/lib/message-to-nodes";

import { Canvas } from "./canvas";
import type { SavedAnnotation } from "./enhanced-message";
import { RightSidebar } from "./right-sidebar";
import { Attachment } from "./types";

import type { FileUIPart } from "ai";

// Fetcher for SWR
const fetcher = (url: string) => fetch(url).then((res) => res.json());

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
  defaultModelId = "gemini-2.5-flash",
}: {
  id: string;
  initialMessages: Array<UIMessage>;
  isThread?: boolean;
  parentMessageId?: string;
  mainChatId?: string;
  className?: string;
  onFinish?: () => void;
  isUserPro?: boolean;
  isGuest?: boolean;
  selectedText?: string;
  defaultModelId?: string;
}) {
  const router = useRouter();
  const chatIdForSubmit = isThread ? mainChatId! : id;

  // Model selection state
  const [selectedModel, setSelectedModel] = useState<string>(defaultModelId);
  const [input, setInput] = useState("");
  const [isMounted, setIsMounted] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(384);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedNodeType, setSelectedNodeType] = useState<NodeType>("text");

  // Usage limit state
  const [usageLimitInfo, setUsageLimitInfo] = useState<{
    exceeded: boolean;
    isPro: boolean;
    currentUsage: number;
    limit: number;
    periodEnd: Date | string;
  } | null>(null);

  const MIN_SIDEBAR_WIDTH = 240;
  const MAX_SIDEBAR_WIDTH = 720;
  const MIN_MAIN_WIDTH = 240;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { messages, sendMessage, status, stop, setMessages } = useChat({
    id: chatIdForSubmit,
    transport: new TextStreamChatTransport({
      api: isThread ? "/api/thread" : "/api/chat",
    }),
    messages: initialMessages,
    onFinish: () => {
      const url = `/chat/${chatIdForSubmit}`;
      window.history.replaceState({}, "", url);
      onFinish?.();
    },
    onError: (error) => {
      console.error("Chat error:", error);
      try {
        const errorText = error.message || "";
        if (errorText.includes("usage_limit_exceeded") || errorText.includes("429")) {
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

    const fileParts: FileUIPart[] = attachments.map((a) => ({
      type: "file",
      mediaType: a.contentType ?? "",
      filename: a.name ?? "attachment",
      url: a.url,
    } as unknown as FileUIPart));

    sendMessage(
      {
        text: input,
        files: fileParts,
      },
      {
        body: {
          id: chatIdForSubmit,
          modelId: selectedModel,
          ...(isThread && { parentMessageId, mainChatId, selectedText }),
        },
      }
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
    parentMessage: UIMessage;
    selectedText?: string;
  } | null>(null);

  // Annotation (Ask Lucinova) thread state
  const [activeAnnotation, setActiveAnnotation] = useState<{
    id: string;
    selectedText: string;
  } | null>(null);

  // Pending annotation (before first message is sent)
  const [pendingAnnotation, setPendingAnnotation] = useState<{
    messageId: string;
    selectedText: string;
  } | null>(null);

  // Fetch annotations for this chat
  const { data: annotationsData, mutate: mutateAnnotations } = useSWR(
    !isThread ? `/api/annotations?chatId=${id}` : null,
    fetcher
  );

  const annotations: SavedAnnotation[] = annotationsData?.annotations || [];

  // Group annotations by messageId
  const annotationsByMessage = annotations.reduce((acc, ann) => {
    if (!acc[ann.messageId]) {
      acc[ann.messageId] = [];
    }
    acc[ann.messageId].push(ann);
    return acc;
  }, {} as Record<string, SavedAnnotation[]>);

  const handleStartThread = (messageId: string, selectedText?: string) => {
    const parentMessage = messages.find((msg) => msg.id === messageId);
    if (parentMessage && !isThread) {
      setActiveThread({ parentMessage, selectedText });
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
    []
  );

  const handleOpenAnnotation = useCallback(
    (annotationId: string, selectedText: string) => {
      setActiveAnnotation({ id: annotationId, selectedText });
      setActiveThread(null);
      setPendingAnnotation(null);
    },
    []
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
        }),
      });

      if (!res.ok) throw new Error("Failed to create annotation");

      const { annotation } = await res.json();

      mutateAnnotations();

      setActiveAnnotation({
        id: annotation.id,
        selectedText: annotation.selectedText,
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
    [mutateAnnotations]
  );

  // Resize effect — sidebar is always visible on desktop
  useEffect(() => {
    if (isThread) return;

    const handleResize = () => {
      const container = containerRef.current;
      if (!container) return;
      const { width } = container.getBoundingClientRect();
      const maxWidth = Math.min(MAX_SIDEBAR_WIDTH, width - MIN_MAIN_WIDTH);
      setSidebarWidth((prev) =>
        Math.min(Math.max(prev, MIN_SIDEBAR_WIDTH), maxWidth)
      );
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isThread]);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (event: MouseEvent) => {
      const container = containerRef.current;
      if (!container) return;
      const bounds = container.getBoundingClientRect();
      const nextWidth = bounds.right - event.clientX;
      const maxWidth = Math.min(MAX_SIDEBAR_WIDTH, bounds.width - MIN_MAIN_WIDTH);
      const clampedWidth = Math.min(
        Math.max(nextWidth, MIN_SIDEBAR_WIDTH),
        maxWidth
      );
      setSidebarWidth(clampedWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing]);

  // Shared Canvas props
  const canvasProps = {
    messages,
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
  };

  // For threads, render compact layout with Canvas + inline input (no right sidebar)
  if (isThread) {
    return (
      <div
        ref={containerRef}
        className={`flex h-full bg-paper ${className} max-h-full overflow-hidden`}
      >
        <div className="flex-1 flex flex-col min-w-0 h-full max-h-full overflow-hidden">
          <Canvas
            {...canvasProps}
            isThread={true}
            selectedText={selectedText}
          />
        </div>
      </div>
    );
  }

  const showMobileOverlay = activeThread || activeAnnotation || pendingAnnotation;

  // Shared RightSidebar props
  const rightSidebarProps = {
    input,
    setInput,
    handleSubmit,
    status: status as "idle" | "streaming" | "submitted" | "error",
    stop,
    attachments,
    setAttachments,
    messages,
    sendMessage,
    selectedNodeType,
    setSelectedNodeType,
    activeThread,
    activeAnnotation,
    pendingAnnotation,
    onCloseThread: handleCloseThread,
    onCloseAnnotation: handleCloseAnnotation,
    onCreateAnnotation: handleCreateAnnotation,
    onAnnotationCreated: handleAnnotationCreated,
    onAnnotationDeleted: handleAnnotationDeleted,
    selectedModel,
    setSelectedModel,
    isMounted,
    chatId: id,
    isUserPro,
    isGuest,
    usageLimitInfo,
  };

  // Main chat layout: Canvas + always-visible RightSidebar
  return (
    <div
      ref={containerRef}
      className={`flex h-full bg-paper ${className}`}
    >
      {/* Canvas - display area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Canvas {...canvasProps} isThread={false} />
      </div>

      {/* Desktop: Resize handle */}
      <div
        className="hidden lg:flex w-3 shrink-0 items-stretch cursor-col-resize bg-muted/70"
        onMouseDown={(event) => {
          event.preventDefault();
          setIsResizing(true);
        }}
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize sidebar"
      >
        <div className="w-px bg-border" />
        <div className="flex-1 hover:bg-muted/60 transition-colors" />
      </div>

      {/* Desktop: Right Sidebar (always visible) */}
      <div
        className="hidden lg:block h-full min-w-0 overflow-hidden border-l border-border"
        style={{ width: sidebarWidth }}
      >
        <RightSidebar {...rightSidebarProps} />
      </div>

      {/* Mobile: Full screen overlay for thread/annotation only */}
      {showMobileOverlay && (
        <div className="fixed inset-0 z-50 lg:hidden bg-card">
          <RightSidebar {...rightSidebarProps} />
        </div>
      )}
    </div>
  );
}
