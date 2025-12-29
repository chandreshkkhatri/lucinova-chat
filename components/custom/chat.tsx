"use client";

import { useChat } from "@ai-sdk/react";
import { TextStreamChatTransport, UIMessage } from "ai";
import { ChevronRight, Reply, Sparkles, Crown } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import useSWR from "swr";

import { useScrollToBottom } from "@/components/custom/use-scroll-to-bottom";
import { useThreadCount } from "@/components/custom/use-thread-count";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { appConfig } from "@/lib/config";

import { AnnotationThreadView } from "./annotation-thread-view";
import { EnhancedMessage, SavedAnnotation } from "./enhanced-message";
import { MultimodalInput } from "./multimodal-input";
import { ThreadView } from "./thread-view";
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

  // Model selection state - must be declared before useChat
  const [selectedModel, setSelectedModel] = useState<string>(defaultModelId);
  const [input, setInput] = useState("");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { messages, sendMessage, status, stop } = useChat({
    id: chatIdForSubmit,
    // Use text-stream transport because the API returns plain text streaming responses
    transport: new TextStreamChatTransport({
      api: isThread ? "/api/thread" : "/api/chat",
    }),
    messages: initialMessages,
    onFinish: () => {
      const url = `/chat/${chatIdForSubmit}`;
      window.history.replaceState({}, "", url);
      onFinish?.();
    },
  });

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() && attachments.length === 0) return;

    // Convert local Attachment objects to FileUIPart expected by the chat transport
    const fileParts: FileUIPart[] = attachments.map((a) => ({
      type: "file",
      mediaType: a.contentType ?? "",
      filename: a.name ?? "attachment",
      data: a.url,
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

  const [messagesContainerRef, messagesEndRef] =
    useScrollToBottom<HTMLDivElement>();

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

  // Handle "Ask Lucinova" click - create pending annotation
  const handleAskLucinova = useCallback(
    (messageId: string, selectedText: string) => {
      setPendingAnnotation({ messageId, selectedText });
      setActiveThread(null);
      setActiveAnnotation(null);
    },
    []
  );

  // Handle opening an existing annotation
  const handleOpenAnnotation = useCallback(
    (annotationId: string, selectedText: string) => {
      setActiveAnnotation({ id: annotationId, selectedText });
      setActiveThread(null);
      setPendingAnnotation(null);
    },
    []
  );

  // Close annotation view
  const handleCloseAnnotation = () => {
    setActiveAnnotation(null);
    setPendingAnnotation(null);
  };

  // Handle annotation deletion
  const handleAnnotationDeleted = () => {
    mutateAnnotations();
  };

  // Create annotation when first message is sent in pending annotation
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

      // Update annotations list
      mutateAnnotations();

      // Switch from pending to active annotation
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

  const MessageComponent = ({
    message,
    showReply = true,
  }: {
    message: UIMessage;
    showReply?: boolean;
  }) => {
    const { threadCount } = useThreadCount(message.id, id);
    const messageAnnotations = annotationsByMessage[message.id] || [];

    return (
      <div className="group relative">
        <div
          className={`flex gap-2 p-2 sm:p-3 ${message.role === "user" ? "justify-end" : ""
            }`}
        >
          {message.role === "assistant" && (
            <Avatar className="size-8 shrink-0">
              <AvatarFallback className="bg-transparent p-0.5">
                <Image
                  src="/images/lucidity-logo.png"
                  alt="Lucidity"
                  width={28}
                  height={28}
                  quality={90}
                  className="size-full object-contain"
                />
              </AvatarFallback>
            </Avatar>
          )}

          <div
            className={`flex-1 max-w-[90%] sm:max-w-[85%] md:max-w-2xl ${message.role === "user" ? "text-right" : ""
              }`}
          >
            <div
              className={`inline-block ${message.role === "user"
                ? "bg-blue-500 text-white rounded-2xl rounded-tr-sm px-3 py-2"
                : "bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-tl-sm px-3 py-2"
                }`}
            >
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <EnhancedMessage
                    message={message}
                    chatId={id}
                    annotations={messageAnnotations}
                    onAskLucinova={(selectedText) =>
                      handleAskLucinova(message.id, selectedText)
                    }
                    onOpenAnnotation={handleOpenAnnotation}
                  />
                </div>
              </div>
            </div>

            {/* Actions - now visible on both mobile and desktop */}
            {showReply && !isThread && message.role === "assistant" && (
              <div className="flex items-center gap-1 mt-2 opacity-100 transition-opacity duration-200">
                {threadCount > 0 && (
                  <button
                    onClick={() => handleStartThread(message.id)}
                    className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 sm:py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-full transition-all duration-200"
                  >
                    <ChevronRight className="size-3" />
                    <span>
                      {threadCount} message{threadCount === 1 ? "" : "s"}
                    </span>
                  </button>
                )}

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => handleStartThread(message.id)}
                        className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all duration-200"
                      >
                        <Reply className="size-3" />
                        <span>Reply</span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      Tip: Select text in a message to see &quot;Ask Lucinova&quot;.
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            )}
          </div>

          {message.role === "user" && (
            <Avatar className="size-8 shrink-0">
              <AvatarFallback className="bg-gray-500 text-white text-xs font-semibold">
                U
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      </div>
    );
  };

  // Determine if sidebar should be shown
  const showSidebar = activeThread || activeAnnotation || pendingAnnotation;

  return (
    <div
      className={`flex h-full ${className} ${isThread ? "max-h-full overflow-hidden" : ""
        } bg-paper`}
    >
      {/* Main Chat Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 ${showSidebar ? "lg:border-r border-gray-200 dark:border-gray-700" : ""
          } ${isThread ? "h-full max-h-full overflow-hidden" : ""}`}
      >
        {/* Model Selector Header */}
        {!isThread && isMounted && (
          <div className="border-b border-gray-200 dark:border-gray-700 px-3 sm:px-4 py-2 sm:py-3 shrink-0">
            <div className="flex items-center justify-center sm:justify-start h-10 lg:h-auto">
              <div className="">
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger className="w-[160px] sm:w-[200px] h-9 sm:h-10 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-sm sm:text-base">
                    <div className="flex items-center gap-2">
                      <Sparkles className="size-4 text-blue-500" />
                      <SelectValue placeholder="Select a model" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <SelectItem
                      value="gemini-3.0-flash"
                      className={
                        isUserPro
                          ? "hover:bg-gray-100 dark:hover:bg-gray-700"
                          : "opacity-50 cursor-not-allowed"
                      }
                      disabled={!isUserPro}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {appConfig.getModelDisplayName("gemini-3.0-flash")}
                        </span>
                        <Crown className="size-3 text-yellow-500" />
                        {!isUserPro && (
                          <span className="text-xs text-gray-500 ml-1">
                            Pro
                          </span>
                        )}
                      </div>
                    </SelectItem>
                    <SelectItem
                      value="gemini-2.5-flash"
                      className="hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {appConfig.getModelDisplayName("gemini-2.5-flash")}
                        </span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}
        {/* Placeholder for server render to prevent layout shift */}
        {!isThread && !isMounted && (
          <div className="border-b border-gray-200 dark:border-gray-700 px-3 sm:px-4 py-2 sm:py-3 shrink-0">
            <div className="flex items-center justify-center sm:justify-start h-10 lg:h-auto">
              <div className="w-[160px] sm:w-[200px] h-9 sm:h-10 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
            </div>
          </div>
        )}

        {/* Messages */}
        <div
          className={`flex-1 overflow-y-auto min-h-0 ${isThread ? "max-h-full" : ""
            }`}
          ref={messagesContainerRef}
        >
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full p-8">
              <div className="text-center max-w-md">
                {isThread && selectedText ? (
                  // Thread with selected text - show query suggestions
                  <>
                    <div className="size-12 mx-auto mb-4 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 flex items-center justify-center">
                      <Sparkles className="size-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Ask about your selection
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-6 text-sm">
                      What would you like to know about the selected text?
                    </p>

                    {/* Query suggestions for selected text */}
                    <div className="flex flex-col gap-2 mb-4">
                      <button
                        onClick={() =>
                          setInput("Can you explain this in simpler terms?")
                        }
                        className="p-3 text-left rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          Can you explain this in simpler terms?
                        </p>
                      </button>

                      <button
                        onClick={() =>
                          setInput("What are the key points here?")
                        }
                        className="p-3 text-left rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          What are the key points here?
                        </p>
                      </button>

                      <button
                        onClick={() =>
                          setInput("Can you provide more context about this?")
                        }
                        className="p-3 text-left rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          Can you provide more context about this?
                        </p>
                      </button>

                      <button
                        onClick={() =>
                          setInput("How does this relate to the main topic?")
                        }
                        className="p-3 text-left rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          How does this relate to the main topic?
                        </p>
                      </button>
                    </div>
                  </>
                ) : isThread ? (
                  // Regular thread - minimal content
                  <>
                    <div className="size-12 mx-auto mb-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center">
                      <Reply className="size-6 text-gray-600 dark:text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Thread Discussion
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-6 text-sm">
                      Continue the conversation about the parent message.
                    </p>
                  </>
                ) : (
                  // Main chat - original welcome
                  <>
                    <div className="size-16 mx-auto mb-4 rounded-xl flex items-center justify-center">
                      <Image
                        src="/images/lucidity-logo.png"
                        alt="Lucidity"
                        width={64}
                        height={64}
                        className="size-full object-contain"
                      />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      Welcome to Lucidity
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">
                      Think in threads, learn in layers.
                    </p>

                    {/* Quick suggestions for main chat */}
                    <div className="flex flex-col gap-2 mb-4">
                      <button
                        onClick={() =>
                          setInput("Explain a complex concept to me")
                        }
                        className="p-3 text-left rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          Explain a complex concept simply
                        </p>
                      </button>

                      <button
                        onClick={() =>
                          setInput(
                            "Help me create a study plan for a new subject"
                          )
                        }
                        className="p-3 text-left rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          Create a personalized study plan
                        </p>
                      </button>

                      <button
                        onClick={() =>
                          setInput(
                            "Summarize this text and extract key learning points"
                          )
                        }
                        className="p-3 text-left rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          Summarize and extract key points
                        </p>
                      </button>
                    </div>

                    <div className="text-xs text-gray-400 dark:text-gray-500">
                      Type your message below to start our conversation
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="py-4">
              {messages.map((message) => (
                <MessageComponent
                  key={message.id}
                  message={message}
                  showReply={!isThread}
                />
              ))}
            </div>
          )}

          {(status === "streaming" || status === "submitted") && (
            <div className="p-3">
              <div className="flex items-center gap-2">
                <Avatar className="size-8 shrink-0">
                  <AvatarFallback className="bg-white border border-gray-200 dark:border-gray-700 p-1">
                    <Image
                      src="/images/lucidity-logo.png"
                      alt="Lucidity"
                      width={24}
                      height={24}
                      className="size-full object-contain"
                    />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-tl-sm px-3 py-2">
                  <div className="typing-indicator flex gap-1">
                    <span className="size-2 bg-gray-400 rounded-full"></span>
                    <span className="size-2 bg-gray-400 rounded-full"></span>
                    <span className="size-2 bg-gray-400 rounded-full"></span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div
            ref={messagesEndRef}
            className="shrink-0 min-w-[24px] min-h-[24px]"
          />
        </div>

        {/* Input */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-3 sm:p-4 shrink-0">
          <div className="max-w-4xl mx-auto">
            {isGuest &&
              messages.filter((m) => m.role === "user").length >= 5 ? (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 text-center">
                <Sparkles className="size-12 mx-auto mb-3 text-blue-600 dark:text-blue-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Ready for more?
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  You&apos;ve reached the guest message limit. Sign up to continue
                  chatting and unlock unlimited messages!
                </p>
                <button
                  onClick={() => router.push("/register")}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center gap-2"
                >
                  <Sparkles className="size-5" />
                  Sign Up Free
                </button>
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
      </div>

      {/* Sidebar - Reply Thread, Annotation Thread, or Pending Annotation */}
      {!isThread && showSidebar && (
        <>
          {/* Mobile: Full screen modal */}
          <div className="fixed inset-0 z-50 lg:hidden bg-white dark:bg-gray-900">
            {activeThread ? (
              <ThreadView
                parentMessage={activeThread.parentMessage}
                selectedText={activeThread.selectedText}
                mainChatId={id}
                onClose={handleCloseThread}
                className="size-full"
                modelId={selectedModel}
              />
            ) : activeAnnotation ? (
              <AnnotationThreadView
                annotationId={activeAnnotation.id}
                selectedText={activeAnnotation.selectedText}
                chatId={id}
                onClose={handleCloseAnnotation}
                onDelete={handleAnnotationDeleted}
                className="size-full"
                modelId={selectedModel}
              />
            ) : pendingAnnotation ? (
              <PendingAnnotationView
                selectedText={pendingAnnotation.selectedText}
                messageId={pendingAnnotation.messageId}
                chatId={id}
                onClose={handleCloseAnnotation}
                onCreateAnnotation={handleCreateAnnotation}
                onAnnotationCreated={(annotationId, selectedText) => {
                  setActiveAnnotation({ id: annotationId, selectedText });
                  setPendingAnnotation(null);
                  mutateAnnotations();
                }}
                className="size-full"
              />
            ) : null}
          </div>

          {/* Desktop: Sidebar */}
          <div className="hidden lg:block h-full overflow-hidden border-l border-gray-200 dark:border-gray-700 w-96">
            {activeThread ? (
              <ThreadView
                parentMessage={activeThread.parentMessage}
                selectedText={activeThread.selectedText}
                mainChatId={id}
                onClose={handleCloseThread}
                className="size-full"
                modelId={selectedModel}
              />
            ) : activeAnnotation ? (
              <AnnotationThreadView
                annotationId={activeAnnotation.id}
                selectedText={activeAnnotation.selectedText}
                chatId={id}
                onClose={handleCloseAnnotation}
                onDelete={handleAnnotationDeleted}
                className="size-full"
                modelId={selectedModel}
              />
            ) : pendingAnnotation ? (
              <PendingAnnotationView
                selectedText={pendingAnnotation.selectedText}
                messageId={pendingAnnotation.messageId}
                chatId={id}
                onClose={handleCloseAnnotation}
                onCreateAnnotation={handleCreateAnnotation}
                onAnnotationCreated={(annotationId, selectedText) => {
                  setActiveAnnotation({ id: annotationId, selectedText });
                  setPendingAnnotation(null);
                  mutateAnnotations();
                }}
                className="size-full"
              />
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}

// Component for pending annotation (before first message)
function PendingAnnotationView({
  selectedText,
  messageId,
  chatId,
  onClose,
  onCreateAnnotation,
  onAnnotationCreated,
  className = "",
}: {
  selectedText: string;
  messageId: string;
  chatId: string;
  onClose: () => void;
  onCreateAnnotation: (firstMessage: string) => Promise<string | null>;
  onAnnotationCreated: (annotationId: string, selectedText: string) => void;
  className?: string;
}) {
  const [input, setInput] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isCreating) return;

    setIsCreating(true);
    try {
      // First create the annotation
      const res = await fetch("/api/annotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageId,
          chatId,
          selectedText,
        }),
      });

      if (!res.ok) throw new Error("Failed to create annotation");

      const { annotation } = await res.json();

      // Switch to the annotation thread view which will handle the chat
      onAnnotationCreated(annotation.id, selectedText);
    } catch (error) {
      console.error("Failed to create annotation:", error);
      setIsCreating(false);
    }
  };

  return (
    <div
      className={`flex flex-col bg-gray-50 dark:bg-gray-950 h-full max-h-full overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
            <Sparkles className="size-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">
              Ask Lucinova
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              New annotation
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
        >
          ×
        </button>
      </div>

      {/* Selected Text Display */}
      <div className="px-4 py-3 bg-purple-50 dark:bg-purple-900/20 border-b border-purple-100 dark:border-purple-800/30 shrink-0">
        <div className="text-sm italic text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 rounded-lg px-4 py-2 border-l-4 border-purple-400 dark:border-purple-500 max-h-24 overflow-y-auto">
          {'"'}{selectedText}{'"'}
        </div>
      </div>

      {/* Empty state with suggestions */}
      <div className="flex-1 overflow-y-auto p-4 bg-white dark:bg-gray-900">
        <div className="text-center max-w-md mx-auto py-8">
          <div className="size-12 mx-auto mb-4 rounded-xl bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800 flex items-center justify-center">
            <Sparkles className="size-6 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Ask about this text
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6 text-sm">
            What would you like to know about the selected text?
          </p>

          {/* Quick suggestions */}
          <div className="flex flex-col gap-2 mb-4">
            <button
              onClick={() => setInput("Can you explain this in simpler terms?")}
              className="p-3 text-left rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Explain this in simpler terms
              </p>
            </button>

            <button
              onClick={() => setInput("What are the key points here?")}
              className="p-3 text-left rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <p className="text-sm text-gray-700 dark:text-gray-300">
                What are the key points?
              </p>
            </button>

            <button
              onClick={() => setInput("Can you give me an example?")}
              className="p-3 text-left rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Give me an example
              </p>
            </button>
          </div>
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-3 sm:p-4 shrink-0 bg-white dark:bg-gray-900">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about this text..."
            className="flex-1 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            disabled={isCreating}
          />
          <button
            type="submit"
            disabled={!input.trim() || isCreating}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            {isCreating ? "..." : "Ask"}
          </button>
        </form>
      </div>
    </div>
  );
}
