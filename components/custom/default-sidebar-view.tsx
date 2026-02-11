"use client";

import { UIMessage } from "ai";
import { MessageSquare, Sparkles, FileCode, GitBranch, Crown, Info } from "lucide-react";
import { useRouter } from "next/navigation";
import { Dispatch, SetStateAction } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { appConfig } from "@/lib/config";
import type { NodeType } from "@/lib/message-to-nodes";

import { MultimodalInput } from "./multimodal-input";
import { UsageLimitBanner } from "./usage-limit-banner";
import type { Attachment } from "./types";

interface DefaultSidebarViewProps {
  input: string;
  setInput: (value: string) => void;
  handleSubmit: (e?: React.FormEvent) => void;
  status: "idle" | "streaming" | "submitted" | "error";
  stop: () => void;
  attachments: Attachment[];
  setAttachments: Dispatch<SetStateAction<Attachment[]>>;
  messages: UIMessage[];
  sendMessage: (message: { text: string; files?: any[]; options?: { body?: any } }) => Promise<void>;
  isGuest: boolean;
  usageLimitInfo: {
    exceeded: boolean;
    isPro: boolean;
    currentUsage: number;
    limit: number;
    periodEnd: Date | string;
  } | null;
  selectedNodeType: NodeType;
  setSelectedNodeType: (type: NodeType) => void;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  isUserPro: boolean;
  isMounted: boolean;
}

const nodeTypeOptions: { value: NodeType; label: string; icon: React.ReactNode }[] = [
  { value: "text", label: "Text", icon: <MessageSquare className="size-4" /> },
  { value: "mermaid", label: "Mermaid", icon: <GitBranch className="size-4" /> },
  { value: "code", label: "Code", icon: <FileCode className="size-4" /> },
];

export function DefaultSidebarView({
  input,
  setInput,
  handleSubmit,
  status,
  stop,
  attachments,
  setAttachments,
  messages,
  sendMessage,
  isGuest,
  usageLimitInfo,
  selectedNodeType,
  setSelectedNodeType,
  selectedModel,
  setSelectedModel,
  isUserPro,
  isMounted,
}: DefaultSidebarViewProps) {
  const router = useRouter();

  return (
    <div className="flex flex-col h-full bg-secondary">
      {/* Header with model selector */}
      <div className="px-4 py-3 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-2 mb-3">
          <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Sparkles className="size-4 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">Chat</h2>
            <p className="text-xs text-muted-foreground">Ask anything</p>
          </div>
        </div>
        {isMounted ? (
          <Select value={selectedModel} onValueChange={setSelectedModel}>
            <SelectTrigger className="w-full h-9 bg-muted/50 border-border text-sm">
              <div className="flex items-center gap-2">
                <Sparkles className="size-3.5 text-primary" />
                <SelectValue placeholder="Select a model" />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="gemini-3.0-flash" className="hover:bg-muted">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{appConfig.getModelDisplayName("gemini-3.0-flash")}</span>
                  <TooltipProvider delayDuration={300}>
                    <Tooltip>
                      <TooltipTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Info className="size-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p>Powered by {appConfig.getGeminiName("gemini-3.0-flash")}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </SelectItem>
              <SelectItem value="gemini-2.5-flash" className="hover:bg-muted">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{appConfig.getModelDisplayName("gemini-2.5-flash")}</span>
                  <TooltipProvider delayDuration={300}>
                    <Tooltip>
                      <TooltipTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Info className="size-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p>Powered by {appConfig.getGeminiName("gemini-2.5-flash")}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </SelectItem>
              <SelectItem
                value="gemini-3.0-pro"
                className={isUserPro ? "hover:bg-muted" : "opacity-50 cursor-not-allowed"}
                disabled={!isUserPro}
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">{appConfig.getModelDisplayName("gemini-3.0-pro")}</span>
                  <Crown className="size-3 text-yellow-500" />
                  {!isUserPro && <span className="text-xs text-muted-foreground ml-1">Pro</span>}
                  <TooltipProvider delayDuration={300}>
                    <Tooltip>
                      <TooltipTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Info className="size-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p>Powered by {appConfig.getGeminiName("gemini-3.0-pro")}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <div className="w-full h-9 bg-muted rounded animate-pulse" />
        )}
      </div>

      {/* Welcome / empty state */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex flex-col items-center justify-center h-full text-center max-w-sm mx-auto">
          <div className="size-12 mx-auto mb-4 rounded-xl bg-muted border border-border flex items-center justify-center">
            <MessageSquare className="size-6 text-muted-foreground" />
          </div>
          <h3 className="text-base font-semibold text-foreground mb-2">
            Start a conversation
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Type below to chat. Select text in the canvas to annotate it, or click Reply to start a thread.
          </p>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>Use the node type selector to create specific content types like diagrams or code.</p>
          </div>
        </div>
      </div>

      {/* Input area */}
      <div className="border-t border-border p-3 sm:p-4 shrink-0 bg-card">
        <div className="space-y-3">
          {/* Node type selector */}
          <div className="flex items-center gap-2">
            <Select value={selectedNodeType} onValueChange={(v) => setSelectedNodeType(v as NodeType)}>
              <SelectTrigger className="w-full h-8 bg-muted/50 border-border text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {nodeTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value} className="hover:bg-muted">
                    <div className="flex items-center gap-2">
                      {option.icon}
                      <span>{option.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Chat input */}
          {usageLimitInfo?.exceeded ? (
            <UsageLimitBanner
              isPro={usageLimitInfo.isPro}
              currentUsage={usageLimitInfo.currentUsage}
              limit={usageLimitInfo.limit}
              periodEnd={usageLimitInfo.periodEnd}
            />
          ) : isGuest && messages.filter((m) => m.role === "user").length >= 5 ? (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-center">
              <Sparkles className="size-8 mx-auto mb-2 text-primary" />
              <h3 className="text-sm font-semibold text-foreground mb-1">Ready for more?</h3>
              <p className="text-xs text-muted-foreground mb-3">Guest limit reached.</p>
              <button
                onClick={() => router.push("/register")}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg font-medium transition-colors text-sm inline-flex items-center gap-1"
              >
                <Sparkles className="size-4" />
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
  );
}
