"use client";

import { useChat } from "@ai-sdk/react";
import { TextStreamChatTransport, UIMessage } from "ai";
import { ChevronUp } from "lucide-react";
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

const MIN_SIDEBAR_WIDTH = 240;
const MAX_SIDEBAR_WIDTH = 720;
const MIN_MAIN_WIDTH = 240;
const MIN_BOTTOM_PANEL = 120;
const MAX_BOTTOM_PANEL_RATIO = 0.7;
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
  const [selectedNodeType, setSelectedNodeType] = useState<NodeType>("text");

  // Desktop sidebar resize state
  const [sidebarWidth, setSidebarWidth] = useState(384);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Mobile bottom panel state
  const [bottomPanelHeight, setBottomPanelHeight] = useState(DEFAULT_BOTTOM_PANEL);
  const [isBottomResizing, setIsBottomResizing] = useState(false);
  const [isBottomPanelCollapsed, setIsBottomPanelCollapsed] = useState(false);
  const mobileContainerRef = useRef<HTMLDivElement>(null);

  // Usage limit state
  const [usageLimitInfo, setUsageLimitInfo] = useState<{
    exceeded: boolean;
    isPro: boolean;
    currentUsage: number;
    limit: number;
    periodEnd: Date | string;
  } | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { messages, sendMessage, status, stop, setMessages, regenerate } = useChat({
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
    initialMessage?: string;
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
    [mutateAnnotations]
  );

  // Edit last user message and regenerate
  const handleEditMessage = useCallback(
    (messageId: string, newText: string) => {
      const msgIndex = messages.findIndex((m) => m.id === messageId);
      if (msgIndex === -1) return;

      setMessages((prev) => {
        const updated = [...prev];
        updated[msgIndex] = {
          ...updated[msgIndex],
          parts: [{ type: "text" as const, text: newText }],
        };
        return updated.slice(0, msgIndex + 1);
      });

      regenerate();
    },
    [messages, setMessages, regenerate]
  );

  const handleRegenerate = useCallback(() => {
    regenerate();
  }, [regenerate]);

  // Desktop sidebar resize effect
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

  // Mobile bottom panel resize effect
  useEffect(() => {
    if (!isBottomResizing) return;

    const handleMove = (clientY: number) => {
      const container = mobileContainerRef.current;
      if (!container) return;
      const bounds = container.getBoundingClientRect();
      const maxHeight = bounds.height * MAX_BOTTOM_PANEL_RATIO;
      const nextHeight = bounds.bottom - clientY;
      const clampedHeight = Math.min(
        Math.max(nextHeight, MIN_BOTTOM_PANEL),
        maxHeight
      );
      setBottomPanelHeight(clampedHeight);
      setIsBottomPanelCollapsed(clampedHeight <= MIN_BOTTOM_PANEL);
    };

    const handleMouseMove = (event: MouseEvent) => handleMove(event.clientY);
    const handleTouchMove = (event: TouchEvent) => {
      if (event.touches.length > 0) {
        handleMove(event.touches[0].clientY);
      }
    };

    const handleEnd = () => setIsBottomResizing(false);

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleEnd);
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleEnd);
    document.body.style.cursor = "row-resize";
    document.body.style.userSelect = "none";

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleEnd);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleEnd);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isBottomResizing]);

  const toggleBottomPanel = () => {
    if (isBottomPanelCollapsed) {
      setBottomPanelHeight(DEFAULT_BOTTOM_PANEL);
      setIsBottomPanelCollapsed(false);
    } else {
      setBottomPanelHeight(COLLAPSED_BOTTOM_PANEL);
      setIsBottomPanelCollapsed(true);
    }
  };

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
    onEditMessage: handleEditMessage,
    onRegenerate: handleRegenerate,
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

  // Main chat layout
  return (
    <div
      ref={containerRef}
      className={`flex h-full bg-paper ${className}`}
    >
      {/* Mobile: Vertical split (Canvas top + bottom panel) */}
      <div ref={mobileContainerRef} className="flex flex-col flex-1 min-w-0 lg:hidden h-full">
        {/* Canvas fills remaining space */}
        <div className="flex-1 min-h-0">
          <Canvas {...canvasProps} isThread={false} />
        </div>

        {/* Drag handle */}
        <div
          className="shrink-0 flex items-center justify-center border-t border-border bg-muted/50 cursor-row-resize touch-none"
          style={{ height: 24 }}
          onMouseDown={(e) => {
            e.preventDefault();
            setIsBottomResizing(true);
          }}
          onTouchStart={(e) => {
            e.preventDefault();
            setIsBottomResizing(true);
          }}
          onClick={toggleBottomPanel}
          role="separator"
          aria-orientation="horizontal"
          aria-label="Resize chat panel"
        >
          <ChevronUp
            className={`size-4 text-muted-foreground transition-transform duration-200 ${
              isBottomPanelCollapsed ? "rotate-180" : ""
            }`}
          />
        </div>

        {/* Bottom panel — RightSidebar */}
        <div
          className="shrink-0 overflow-hidden border-t border-border"
          style={{ height: bottomPanelHeight }}
        >
          <RightSidebar {...rightSidebarProps} />
        </div>
      </div>

      {/* Desktop: Horizontal layout (Canvas + resize + right sidebar) */}
      <div className="hidden lg:flex flex-1 min-w-0 h-full">
        {/* Canvas */}
        <div className="flex-1 flex flex-col min-w-0">
          <Canvas {...canvasProps} isThread={false} />
        </div>

        {/* Resize handle */}
        <div
          className="flex w-3 shrink-0 items-stretch cursor-col-resize bg-muted/70"
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

        {/* Right Sidebar */}
        <div
          className="h-full min-w-0 overflow-hidden border-l border-border"
          style={{ width: sidebarWidth }}
        >
          <RightSidebar {...rightSidebarProps} />
        </div>
      </div>

      {/* Mobile: Full screen overlay for thread/annotation */}
      {showMobileOverlay && (
        <div className="fixed inset-0 z-50 lg:hidden bg-card">
          <RightSidebar {...rightSidebarProps} />
        </div>
      )}
    </div>
  );
}
