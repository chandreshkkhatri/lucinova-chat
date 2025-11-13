"use client";

import { Attachment, Message } from "ai";
import { useChat } from "ai/react";
import { ChevronRight, Reply, Sparkles, Crown } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

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

import { EnhancedMessage } from "./enhanced-message";
import { MultimodalInput } from "./multimodal-input";
import { ThreadView } from "./thread-view";

export function Chat({
  id,
  initialMessages,
  isThread = false,
  parentMessageId,
  mainChatId,
  className = "",
  onFinish,
  isPro = false,
  isGuest = false,
  selectedText,
}: {
  id: string;
  initialMessages: Array<Message>;
  isThread?: boolean;
  parentMessageId?: string;
  mainChatId?: string;
  className?: string;
  onFinish?: () => void;
  isPro?: boolean;
  isGuest?: boolean;
  selectedText?: string;
}) {
  const router = useRouter();
  const chatIdForSubmit = isThread ? mainChatId! : id;
  const { messages, handleSubmit, input, setInput, append, isLoading, stop } =
    useChat({
      id: chatIdForSubmit,
      body: {
        id: chatIdForSubmit,
        ...(isThread && { parentMessageId, mainChatId, selectedText }),
      },
      initialMessages,
      maxSteps: 10,
      api: isThread ? "/api/thread" : "/api/chat",
      onFinish: () => {
        const url = `/chat/${chatIdForSubmit}`;
        window.history.replaceState({}, "", url);
        onFinish?.();
      },
    });

  const [messagesContainerRef, messagesEndRef] =
    useScrollToBottom<HTMLDivElement>();

  const [attachments, setAttachments] = useState<Array<Attachment>>([]);
  const [activeThread, setActiveThread] = useState<{
    parentMessage: Message;
    selectedText?: string;
  } | null>(null);
  const [selectedModel, setSelectedModel] =
    useState<string>("gemini-2.0-flash");

  const handleStartThread = (messageId: string, selectedText?: string) => {
    const parentMessage = messages.find((msg) => msg.id === messageId);
    if (parentMessage && !isThread) {
      setActiveThread({ parentMessage, selectedText });
    }
  };

  const handleCloseThread = () => {
    setActiveThread(null);
    if (!isThread) {
      router.push(`/chat/${id}`);
    }
  };

  // Removed collapsible thread preview behavior – clicking the count will open the thread modal

  const MessageComponent = ({
    message,
    showReply = true,
  }: {
    message: Message;
    showReply?: boolean;
  }) => {
    const { threadCount } = useThreadCount(message.id, id);

    return (
      <div className="group relative">
        <div
          className={`flex gap-2 p-2 sm:p-3 ${
            message.role === "user" ? "justify-end" : ""
          }`}
        >
          {message.role === "assistant" && (
            <Avatar className="size-8 shrink-0">
              <AvatarFallback className="bg-white border border-gray-200 dark:border-gray-700 p-1">
                <Image
                  src="/images/lucidity-logo.svg"
                  alt="Lucidity"
                  width={24}
                  height={24}
                  className="size-full object-contain"
                />
              </AvatarFallback>
            </Avatar>
          )}

          <div
            className={`flex-1 max-w-[90%] sm:max-w-[85%] md:max-w-2xl ${
              message.role === "user" ? "text-right" : ""
            }`}
          >
            <div
              className={`inline-block ${
                message.role === "user"
                  ? "bg-blue-500 text-white rounded-2xl rounded-tr-sm px-3 py-2"
                  : "bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-tl-sm px-3 py-2"
              }`}
            >
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <EnhancedMessage
                    message={message}
                    onAnnotationReply={(question, text) => {
                      // Handle annotation replies if needed
                    }}
                    onAskTara={(selectedText) =>
                      handleStartThread(message.id, selectedText)
                    }
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
                      Tip: Select text in a message to see “Ask Tara”.
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

        {/* Collapsible thread preview removed as per requirements */}
      </div>
    );
  };

  return (
    <div
      className={`flex h-full ${className} ${
        isThread ? "max-h-full overflow-hidden" : ""
      } bg-white dark:bg-gray-900`}
    >
      {/* Main Chat Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 ${
          activeThread ? "lg:border-r border-gray-200 dark:border-gray-700" : ""
        } ${isThread ? "h-full max-h-full overflow-hidden" : ""}`}
      >
        {/* Model Selector Header */}
        {!isThread && (
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
                      value="gemini-2.5-flash"
                      className={
                        isPro
                          ? "hover:bg-gray-100 dark:hover:bg-gray-700"
                          : "opacity-50 cursor-not-allowed"
                      }
                      disabled={!isPro}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {appConfig.getModelDisplayName("gemini-2.5-flash")}
                        </span>
                        <Crown className="size-3 text-yellow-500" />
                        {!isPro && (
                          <span className="text-xs text-gray-500 ml-1">
                            Pro
                          </span>
                        )}
                      </div>
                    </SelectItem>
                    <SelectItem
                      value="gemini-2.0-flash"
                      className="hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {appConfig.getModelDisplayName("gemini-2.0-flash")}
                        </span>
                      </div>
                    </SelectItem>
                    {/* Removed gemini-1.5-flash option */}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
        <div
          className={`flex-1 overflow-y-auto min-h-0 ${
            isThread ? "max-h-full" : ""
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
                    <div className="size-16 mx-auto mb-4 rounded-xl bg-white border border-gray-200 dark:border-gray-700 flex items-center justify-center p-3">
                      <Image
                        src="/images/lucidity-logo.svg"
                        alt="Lucidity"
                        width={40}
                        height={40}
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
                        onClick={() => setInput("Tell me about yourself")}
                        className="p-3 text-left rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          Tell me about yourself
                        </p>
                      </button>

                      <button
                        onClick={() =>
                          setInput("Help me write a professional email")
                        }
                        className="p-3 text-left rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          Help me write a professional email
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

          {isLoading && (
            <div className="p-3">
              <div className="flex items-center gap-2">
                <Avatar className="size-8 shrink-0">
                  <AvatarFallback className="bg-white border border-gray-200 dark:border-gray-700 p-1">
                    <Image
                      src="/images/lucidity-logo.svg"
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
            messages.filter((m) => m.role === "user").length >= 3 ? (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 text-center">
                <Sparkles className="size-12 mx-auto mb-3 text-blue-600 dark:text-blue-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Ready for more?
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  You've reached the free message limit. Sign up to continue the
                  conversation and unlock unlimited messages!
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
                isLoading={isLoading}
                stop={stop}
                attachments={attachments}
                setAttachments={setAttachments}
                messages={messages}
                append={append}
                handleSubmit={handleSubmit}
              />
            )}
          </div>
        </div>
      </div>

      {/* Thread Sidebar - Mobile Modal or Desktop Sidebar */}
      {!isThread && activeThread && (
        <>
          {/* Mobile: Full screen modal */}
          <div className="fixed inset-0 z-50 lg:hidden bg-white dark:bg-gray-900">
            <ThreadView
              parentMessage={activeThread.parentMessage}
              selectedText={activeThread.selectedText}
              mainChatId={id}
              onClose={handleCloseThread}
              className="size-full"
            />
          </div>

          {/* Desktop: Sidebar */}
          <div className="hidden lg:block h-full overflow-hidden border-l border-gray-200 dark:border-gray-700 w-96">
            <ThreadView
              parentMessage={activeThread.parentMessage}
              selectedText={activeThread.selectedText}
              mainChatId={id}
              onClose={handleCloseThread}
              className="size-full"
            />
          </div>
        </>
      )}
    </div>
  );
}
