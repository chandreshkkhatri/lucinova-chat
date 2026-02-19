"use client";

import { Message } from "@/lib/chat-utils";
import { Dispatch, SetStateAction } from "react";

import { MultimodalInput } from "./multimodal-input";
import { Attachment } from "./types";
import { UsageLimitBanner } from "./usage-limit-banner";

import type { NodeType } from "@/lib/message-to-nodes";

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  isLoading: boolean;
  stop: () => void;
  attachments: Attachment[];
  setAttachments: Dispatch<SetStateAction<Attachment[]>>;
  messages: Message[];
  sendMessage: (message: {
    text: string;
    files?: any[];
    options?: { body?: any };
  }) => Promise<void>;
  handleSubmit: (e?: React.FormEvent) => void;
  selectedNodeType?: NodeType;
  setSelectedNodeType?: (type: NodeType) => void;
  usageLimitInfo: {
    exceeded: boolean;
    isPro: boolean;
    currentUsage: number;
    limit: number;
    periodEnd: Date | string;
  } | null;
  variant?: "sticky" | "floating";
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  isUserPro?: boolean;
}

export function ChatInput({
  input,
  setInput,
  isLoading,
  stop,
  attachments,
  setAttachments,
  messages,
  sendMessage,
  handleSubmit,
  selectedNodeType,
  setSelectedNodeType,
  usageLimitInfo,
  variant = "sticky",
  selectedModel,
  setSelectedModel,
  isUserPro = false,
}: ChatInputProps) {
  const isFloating = variant === "floating";

  const bannerContent = usageLimitInfo?.exceeded ? (
    <div className={isFloating ? "p-2" : ""}>
      <UsageLimitBanner
        isPro={usageLimitInfo.isPro}
        currentUsage={usageLimitInfo.currentUsage}
        limit={usageLimitInfo.limit}
        periodEnd={usageLimitInfo.periodEnd}
      />
    </div>
  ) : null;

  return (
    <div
      className={
        isFloating
          ? "absolute bottom-0 inset-x-0 z-50 p-4 border-t border-border bg-card/80 backdrop-blur-sm"
          : "shrink-0 p-4 border-t border-border bg-card/80 backdrop-blur-sm relative z-20"
      }
    >
      <div id="chat-input-area" className="max-w-3xl mx-auto pointer-events-auto">
        {usageLimitInfo?.exceeded ? (
          bannerContent
        ) : (
          <MultimodalInput
            input={input}
            setInput={setInput}
            isLoading={isLoading}
            stop={stop}
            attachments={attachments}
            setAttachments={setAttachments}
            messages={messages}
            sendMessage={sendMessage}
            handleSubmit={handleSubmit}
            selectedNodeType={selectedNodeType}
            setSelectedNodeType={setSelectedNodeType}
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
            isUserPro={isUserPro}
          />
        )}
      </div>
    </div>
  );
}
