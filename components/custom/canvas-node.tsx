"use client";

import { UIMessage } from "ai";
import Image from "next/image";
import { useState, memo } from "react";
import { Reply, ChevronRight, Pencil, RefreshCw } from "lucide-react";
import { Handle, Position, NodeProps } from "@xyflow/react";

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

// Define the data structure we expect in the node
export type CanvasNodeData = {
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
  // Node content from our transformation
  type: "text" | "code" | "mermaid";
  content: string;
  language?: string;
  role: "user" | "assistant" | "system" | "data";
};

export const CanvasNodeComponent = memo(({ data }: NodeProps<Node<CanvasNodeData>>) => {
  const {
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
    type,
    content,
    language,
    role
  } = data;

  const { threadCount } = useThreadCount(message.id, chatId);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState("");

  const getMessageText = (msg: UIMessage): string => {
    const textPart = msg.parts?.find((p) => p.type === "text");
    return textPart && "text" in textPart ? textPart.text : "";
  };

  // Render node content based on type
  const renderNodeContent = () => {
    if (type === "mermaid") {
      return <MermaidRenderer content={content} />;
    }
    if (type === "code") {
      return <CodeBlock code={content} language={language} />;
    }
    // Default: text node
    return (
      <div className={`inline-block w-full ${role === "user" ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-3" : "bg-muted rounded-2xl rounded-tl-sm px-4 py-3"}`}>
        <div className="flex items-start gap-2">
          <div className="flex-1 break-words min-w-0">
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
    <div className="group relative max-w-[600px] min-w-[300px]">
      {/* Input Handle (Target) - for incoming connections (replies) */}
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-muted-foreground/50 !w-3 !h-3 !-top-1.5"
      />

      <div className={`flex gap-2 p-2 ${role === "user" ? "flex-row-reverse" : "flex-row"}`}>
        {role === "assistant" && (
          <Avatar className="size-8 shrink-0 mt-1">
            <AvatarFallback className="bg-transparent p-0.5">
              <Image src="/images/lucidity-logo.svg" alt="Lucidity" width={28} height={28} quality={90} className="size-full object-contain" />
            </AvatarFallback>
          </Avatar>
        )}

        <div className={`flex-1 overflow-hidden ${role === "user" ? "text-right" : "text-left"}`}>
          {/* Inline edit UI for user messages */}
          {isEditing && role === "user" ? (
            <div className="w-full text-left">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full p-3 rounded-2xl border border-border bg-card text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                rows={3}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Escape") setIsEditing(false);
                  e.stopPropagation(); // Prevent canvas key hijacking
                }}
                onMouseDown={(e) => e.stopPropagation()} // Prevent drag on query
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
          {showActions && !isThread && role === "user" && isLastUserMessage && !isEditing && (
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
          {showActions && !isThread && role === "assistant" && (
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

        {role === "user" && (
          <Avatar className="size-8 shrink-0 mt-1">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">U</AvatarFallback>
          </Avatar>
        )}
      </div>

      {/* Output Handle (Source) - for outgoing connections (starting threads) */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-muted-foreground/50 !w-3 !h-3 !-bottom-1.5"
      />
    </div>
  );
});

CanvasNodeComponent.displayName = "CanvasNodeComponent";

