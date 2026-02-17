"use client";

import { UIMessage } from "ai";
import {
  MessageSquare,
  Sparkles,
  FileCode,
  GitBranch,
  Crown,
  Info,
  Type,
  Eye,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Dispatch, SetStateAction } from "react";

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
import { SUGGESTIONS } from "@/lib/constants";

import { MultimodalInput } from "./multimodal-input";
import { UsageLimitBanner } from "./usage-limit-banner";

import type { Attachment } from "./types";
import type { NodeType } from "@/lib/message-to-nodes";

interface DefaultSidebarViewProps {
  input: string;
  setInput: (value: string) => void;
  handleSubmit: (e?: React.FormEvent) => void;
  status: "idle" | "streaming" | "submitted" | "error";
  stop: () => void;
  attachments: Attachment[];
  setAttachments: Dispatch<SetStateAction<Attachment[]>>;
  messages: UIMessage[];
  sendMessage: (message: {
    text: string;
    files?: any[];
    options?: { body?: any };
  }) => Promise<void>;
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
  selectedNode: {
    id: string;
    content: string;
    role: string;
    type: string;
  } | null;
}

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
  selectedNode,
}: DefaultSidebarViewProps) {
  const router = useRouter();

  return (
    <div className="flex flex-col h-full bg-secondary">
      {/* Header with model selector - Stacked layout */}
      <div className="px-4 py-3 border-b border-border bg-card shrink-0 space-y-2">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Sparkles className="size-4 text-primary" />
          </div>
          <h2 className="font-semibold text-foreground">Chat</h2>
        </div>

        {isMounted ? (
          <Select value={selectedModel} onValueChange={setSelectedModel}>
            <SelectTrigger className="w-full h-8 bg-muted/50 border-border text-xs">
              <div className="flex items-center gap-1.5 truncate">
                <Sparkles className="size-3 text-primary shrink-0" />
                <SelectValue placeholder="Model" />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              {Object.keys(appConfig.modelNames).map((modelId) => {
                const isProModel = modelId.includes("pro"); // Simple heuristic or add to config
                // Actually relying on specific logic for disabling is safer.
                // The original code was:
                // 3.0-pro: disabled={!isUserPro}

                const isDisabled = modelId === "gemini-3.0-pro" && !isUserPro;
                const showCrown = modelId === "gemini-3.0-pro" && !isUserPro;

                return (
                  <SelectItem
                    key={modelId}
                    value={modelId}
                    className={
                      isDisabled
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:bg-muted"
                    }
                    disabled={isDisabled}
                  >
                    <div className="flex items-center justify-between gap-2 w-full">
                      <div className="flex flex-col">
                        <span className="font-medium text-xs">
                          {appConfig.geminiNames[modelId] || modelId}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {appConfig.modelDescriptions[modelId] || ""}
                        </span>
                      </div>
                      {showCrown && (
                        <Crown className="size-3 text-yellow-500 shrink-0" />
                      )}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        ) : (
          <div className="w-full h-8 bg-muted rounded animate-pulse" />
        )}
      </div>

      {/* Center content: Suggestions or Node Context */}
      <div className="flex-1 overflow-y-auto p-4">
        {selectedNode ? (
          /* Node Context View */
          <div className="flex flex-col gap-4">
            {/* Node type badge */}
            <div className="flex items-center gap-2">
              <div
                className={`p-1.5 rounded-lg ${
                  selectedNode.type === "mermaid"
                    ? "bg-green-500/10 text-green-500"
                    : selectedNode.type === "code"
                      ? "bg-orange-500/10 text-orange-500"
                      : "bg-blue-500/10 text-blue-500"
                }`}
              >
                {selectedNode.type === "mermaid" ? (
                  <GitBranch className="size-4" />
                ) : selectedNode.type === "code" ? (
                  <FileCode className="size-4" />
                ) : (
                  <MessageSquare className="size-4" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground capitalize">
                  {selectedNode.role === "user"
                    ? "Your message"
                    : "AI response"}
                </p>
                <p className="text-xs text-muted-foreground capitalize">
                  {selectedNode.type === "mermaid"
                    ? "Diagram"
                    : selectedNode.type}{" "}
                  node
                </p>
              </div>
            </div>

            {/* Content preview */}
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <Eye className="size-3 text-muted-foreground" />
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  Preview
                </span>
              </div>
              <p className="text-sm text-foreground/80 whitespace-pre-wrap line-clamp-6">
                {selectedNode.content || "(empty)"}
              </p>
            </div>

            {/* Quick actions hint */}
            <div className="text-xs text-muted-foreground space-y-1.5 px-1">
              <p>💬 Type below to ask about this node</p>
              <p>
                ↩️ Click <b>Reply</b> on the node to start a thread
              </p>
              <p>✨ Select text on the node to annotate</p>
            </div>
          </div>
        ) : (
          /* Suggestions View */
          <div className="flex flex-col h-full">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-foreground mb-1">
                Get started
              </h3>
              <p className="text-xs text-muted-foreground">
                Click a suggestion or type your own below.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              {SUGGESTIONS.map((suggestion) => {
                const Icon =
                  suggestion.iconName === "message"
                    ? MessageSquare
                    : suggestion.iconName === "diagram"
                      ? GitBranch
                      : suggestion.iconName === "code"
                        ? FileCode
                        : Sparkles;

                const colorClass =
                  suggestion.color === "blue"
                    ? "text-blue-500"
                    : suggestion.color === "green"
                      ? "text-green-500"
                      : suggestion.color === "orange"
                        ? "text-orange-500"
                        : "text-purple-500";

                return (
                  <button
                    key={suggestion.value}
                    onClick={() => setInput(suggestion.value)}
                    className="p-3 text-left rounded-xl border border-border/50 hover:border-border hover:bg-muted/50 transition-all flex items-center gap-3"
                  >
                    <Icon className={`size-4 ${colorClass} shrink-0`} />
                    <p className="text-sm text-foreground/80">
                      {suggestion.label}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="border-t border-border p-3 sm:p-4 shrink-0 bg-card">
        <div className="space-y-3">
          {/* Chat input */}
          {usageLimitInfo?.exceeded ? (
            <UsageLimitBanner
              isPro={usageLimitInfo.isPro}
              currentUsage={usageLimitInfo.currentUsage}
              limit={usageLimitInfo.limit}
              periodEnd={usageLimitInfo.periodEnd}
            />
          ) : isGuest &&
            messages.filter((m) => m.role === "user").length >= 5 ? (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-center">
              <Sparkles className="size-8 mx-auto mb-2 text-primary" />
              <h3 className="text-sm font-semibold text-foreground mb-1">
                Ready for more?
              </h3>
              <p className="text-xs text-muted-foreground mb-3">
                Guest limit reached.
              </p>
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
              selectedNodeType={selectedNodeType}
              setSelectedNodeType={setSelectedNodeType}
            />
          )}
        </div>
      </div>
    </div>
  );
}
