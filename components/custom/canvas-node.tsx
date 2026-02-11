"use client";

import { UIMessage } from "ai";
import Image from "next/image";
import { useState } from "react";
import { Reply, ChevronRight, Pencil, RefreshCw } from "lucide-react";

import { useThreadCount } from "@/components/custom/use-thread-count";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { EnhancedMessage, SavedAnnotation } from "./enhanced-message";
import { MermaidRenderer } from "./mermaid-renderer";
import { CodeBlock } from "./code-block";
import type { CanvasNode as CanvasNodeType } from "@/lib/message-to-nodes";

interface CanvasNodeProps {
  node: CanvasNodeType;
  message: UIMessage;
  chatId: string;
  annotations?: SavedAnnotation[];
  onAskLucinova?: (messageId: string, selectedText: string) => void;
  onOpenAnnotation?: (annotationId: string, selectedText: string) => void;
  onStartThread?: (messageId: string, selectedText?: string) => void;
  isThread?: boolean;
  showActions?: boolean;
  onEditMessage?: (messageId: string, newText: string) => void;
  onRegenerate?: () => void;
  isLastUserMessage?: boolean;
  isLastAssistantMessage?: boolean;
}

export function CanvasNodeComponent({
  node,
  message,
  chatId,
  annotations = [],
  onAskLucinova,
  onOpenAnnotation,
  onStartThread,
  isThread = false,
  showActions = true,
  onEditMessage,
  onRegenerate,
  isLastUserMessage = false,
  isLastAssistantMessage = false,
}: CanvasNodeProps) {
  const { threadCount } = useThreadCount(message.id, chatId);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState("");

  const getMessageText = (msg: UIMessage): string => {
    const textPart = msg.parts?.find((p) => p.type === "text");
    return textPart && "text" in textPart ? textPart.text : "";
  };

  // Render node content based on type
  const renderNodeContent = () => {
    if (node.type === "mermaid") {
      return <MermaidRenderer content={node.content} />;
    }
    if (node.type === "code") {
      return <CodeBlock code={node.content} language={node.language} />;
    }
    // Default: text node
    return (
      <div className={`inline-block ${node.role === "user" ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-3 py-2" : "bg-muted rounded-2xl rounded-tl-sm px-3 py-2"}`}>
        <div className="flex items-start gap-2">
          <div className="flex-1 break-words">
            <EnhancedMessage
              message={message}
              chatId={chatId}
              annotations={annotations}
              onAskLucinova={(selectedText) => onAskLucinova?.(message.id, selectedText)}
              onOpenAnnotation={onOpenAnnotation}
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="group relative">
      <div className={`flex gap-2 p-2 sm:p-3 ${node.role === "user" ? "justify-end" : ""}`}>
        {node.role === "assistant" && (
          <Avatar className="size-8 shrink-0">
            <AvatarFallback className="bg-transparent p-0.5">
              <Image src="/images/lucidity-logo.svg" alt="Lucidity" width={28} height={28} quality={90} className="size-full object-contain" />
            </AvatarFallback>
          </Avatar>
        )}

        <div className={`flex-1 ${isThread ? "max-w-[90%] sm:max-w-[85%]" : "max-w-[90%] sm:max-w-[85%] md:max-w-2xl"} ${node.role === "user" ? "text-right" : ""}`}>
          {/* Inline edit UI for user messages */}
          {isEditing && node.role === "user" ? (
            <div className="w-full text-left">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full p-3 rounded-2xl border border-border bg-card text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                rows={3}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Escape") setIsEditing(false);
                }}
              />
              <div className="flex justify-end gap-2 mt-1.5">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onEditMessage?.(message.id, editText);
                    setIsEditing(false);
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-full transition-all duration-200"
                >
                  Save & Regenerate
                </button>
              </div>
            </div>
          ) : (
            renderNodeContent()
          )}

          {/* Edit action for last user message */}
          {showActions && !isThread && node.role === "user" && isLastUserMessage && !isEditing && (
            <div className="flex items-center justify-end gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <button
                onClick={() => {
                  setEditText(getMessageText(message));
                  setIsEditing(true);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-muted-foreground hover:text-primary hover:bg-muted rounded-full transition-all duration-200"
              >
                <Pencil className="size-3" />
                <span>Edit</span>
              </button>
            </div>
          )}

          {/* Actions for assistant messages */}
          {showActions && !isThread && node.role === "assistant" && (
            <div className="flex items-center gap-1 mt-2 opacity-100 transition-opacity duration-200">
              {threadCount > 0 && (
                <button
                  onClick={() => onStartThread?.(message.id)}
                  className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 sm:py-1.5 text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-full transition-all duration-200"
                >
                  <ChevronRight className="size-3" />
                  <span>{threadCount} message{threadCount === 1 ? "" : "s"}</span>
                </button>
              )}

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => onStartThread?.(message.id)}
                      className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs font-medium text-muted-foreground hover:text-primary hover:bg-muted rounded-full transition-all duration-200"
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

              {isLastAssistantMessage && (
                <button
                  onClick={() => onRegenerate?.()}
                  className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs font-medium text-muted-foreground hover:text-primary hover:bg-muted rounded-full transition-all duration-200"
                >
                  <RefreshCw className="size-3" />
                  <span>Regenerate</span>
                </button>
              )}
            </div>
          )}
        </div>

        {node.role === "user" && (
          <Avatar className="size-8 shrink-0">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">U</AvatarFallback>
          </Avatar>
        )}
      </div>
    </div>
  );
}
