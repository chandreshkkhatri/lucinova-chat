"use client";

import { Message } from "@/lib/chat-utils";
import Image from "next/image";
import { useState, memo, useRef, useEffect, useCallback, useMemo } from "react";
import { Reply, ChevronRight, Pencil, RefreshCw } from "lucide-react";
import { Handle, Position, NodeProps, useUpdateNodeInternals } from "@xyflow/react";

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

// Define the data structure we expect in the node
export type CanvasNodeData = {
  message: Message;
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

export const CanvasNodeComponent = memo(({ data: rawData, id: nodeId }: NodeProps) => {
  const data = rawData as CanvasNodeData;
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
    role,
  } = data;

  const { threadCount } = useThreadCount(message.id, chatId);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState("");

  // Track vertical offsets for each annotation's right-side handle.
  // Keys are annotation IDs, values are top-offsets in px relative to node.
  const [annHandleOffsets, setAnnHandleOffsets] = useState<Record<string, number>>({});

  // Tell React Flow to re-measure this node when async content (images,
  // diagrams) finishes loading and changes the DOM height.
  const updateNodeInternals = useUpdateNodeInternals();
  const nodeRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const prevHeightRef = useRef<number>(0);

  // Measure annotation handle offsets after content renders.
  // Each handle should sit at the vertical midpoint of its selected text.
  const measureAnnotationOffsets = useCallback(() => {
    const nodeEl = nodeRef.current;
    const contentEl = contentRef.current;
    if (!nodeEl || !contentEl || annotations.length === 0) return;

    const nodeRect = nodeEl.getBoundingClientRect();
    const offsets: Record<string, number> = {};

    annotations.forEach((ann) => {
      // Search within the content area but compute offset relative to node top
      const yPos = findTextVerticalCenter(contentEl, ann.selectedText, nodeRect);
      if (yPos !== null) {
        offsets[ann.id] = yPos;
      }
    });

    setAnnHandleOffsets((prev) => {
      // Only update if actually changed to avoid re-render loops
      const changed = annotations.some(
        (a) => prev[a.id] !== offsets[a.id],
      );
      if (changed) {
        // Tell React Flow about the new / moved handles
        requestAnimationFrame(() => updateNodeInternals(nodeId));
        return offsets;
      }
      return prev;
    });
  }, [annotations, nodeId, updateNodeInternals]);

  // Watch for any descendant image loads or DOM mutations that change height
  useEffect(() => {
    const el = nodeRef.current;
    if (!el) return;

    const check = () => {
      const h = el.getBoundingClientRect().height;
      if (Math.abs(h - prevHeightRef.current) > 2) {
        prevHeightRef.current = h;
        updateNodeInternals(nodeId);
      }
      measureAnnotationOffsets();
    };

    // Initial measurement
    measureAnnotationOffsets();

    // Listen for <img> load events bubbling up
    el.addEventListener("load", check, true);

    // MutationObserver catches mermaid SVG injection or markdown rendering
    const mo = new MutationObserver(check);
    mo.observe(el, { childList: true, subtree: true, characterData: true });

    return () => {
      el.removeEventListener("load", check, true);
      mo.disconnect();
    };
  }, [nodeId, updateNodeInternals, measureAnnotationOffsets]);

  const getMessageText = (msg: Message): string => {
    const textPart = msg.parts?.find((p: any) => p.type === "text");
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
      <div
        ref={contentRef}
        className={`inline-block w-full ${role === "user" ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-3" : "bg-muted rounded-2xl rounded-tl-sm px-4 py-3"}`}
      >
        <div className="flex items-start gap-2">
          <div className="flex-1 break-words min-w-0">
            <EnhancedMessage
              message={message}
              chatId={chatId}
              annotations={annotations}
              hideAnnotationOverlay
              onAskLucinova={(selectedText) =>
                onAskLucinova?.(message.id, selectedText)
              }
              onOpenAnnotation={onOpenAnnotation}
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div ref={nodeRef} className="group relative max-w-[600px] min-w-[300px]">
      {/* Input Handle (Target) - for incoming connections (replies) */}
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-muted-foreground/50 !w-3 !h-3 !-top-1.5"
      />

      <div
        className={`flex gap-2 p-2 ${role === "user" ? "flex-row-reverse" : "flex-row"}`}
      >
        {role === "assistant" && (
          <Avatar className="size-8 shrink-0 mt-1">
            <AvatarFallback className="bg-transparent p-0.5">
              <Image
                src="/images/lucidity-logo.svg"
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
          className={`flex-1 overflow-hidden ${role === "user" ? "text-right" : "text-left"}`}
        >
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
          {showActions &&
            !isThread &&
            role === "user" &&
            isLastUserMessage &&
            !isEditing && (
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
                  <span>
                    {threadCount} message{threadCount === 1 ? "" : "s"}
                  </span>
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
                    Tip: Select text in a message to see &quot;Ask
                    Lucinova&quot;.
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
            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
              U
            </AvatarFallback>
          </Avatar>
        )}
      </div>

      {/* Output Handle (Source) - for outgoing connections (starting threads) */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-muted-foreground/50 !w-3 !h-3 !-bottom-1.5"
        id="bottom"
      />

      {/* Per-annotation right-side source handles, positioned at the
          vertical center of each annotation's selected text */}
      {annotations.map((ann) => {
        const top = annHandleOffsets[ann.id];
        return (
          <Handle
            key={`ann-${ann.id}`}
            type="source"
            position={Position.Right}
            className="!bg-purple-400/60 !w-2.5 !h-2.5 !-right-1"
            id={`ann-${ann.id}`}
            style={top != null ? { top } : undefined}
          />
        );
      })}

      {/* Hidden fallback handle — always rendered so any edge referencing
          the generic "right" id (e.g. during a render transition) finds it */}
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-purple-400/60 !w-2.5 !h-2.5 !-right-1 !opacity-0"
        id="right"
      />
    </div>
  );
});

// ── Helpers ─────────────────────────────────────────────────────────────

/**
 * Walk the DOM inside `container` looking for `searchText`, return the
 * vertical center of the first match relative to `refRect.top`.
 *
 * Falls back to normalised-whitespace and then case-insensitive substring
 * matching so we still find text inside rendered markdown.
 */
function findTextVerticalCenter(
  container: HTMLElement,
  searchText: string,
  refRect: DOMRect,
): number | null {
  if (!searchText) return null;

  const walker = document.createTreeWalker(
    container,
    NodeFilter.SHOW_TEXT,
    null,
  );
  const textNodes: { node: Node; start: number; length: number }[] = [];
  let fullText = "";
  let currentNode: Node | null;

  while ((currentNode = walker.nextNode())) {
    textNodes.push({
      node: currentNode,
      start: fullText.length,
      length: currentNode.textContent?.length || 0,
    });
    fullText += currentNode.textContent || "";
  }

  // Try multiple matching strategies in order of specificity
  let startGlobal = -1;
  let matchLen = 0;

  // 1. Exact match
  startGlobal = fullText.indexOf(searchText);
  matchLen = searchText.length;

  // 2. Normalised whitespace
  if (startGlobal === -1) {
    const nFull = fullText.replace(/\s+/g, " ");
    const nSearch = searchText.replace(/\s+/g, " ");
    startGlobal = nFull.indexOf(nSearch);
    matchLen = nSearch.length;
  }

  // 3. Case-insensitive
  if (startGlobal === -1) {
    const lFull = fullText.toLowerCase();
    const lSearch = searchText.replace(/\s+/g, " ").toLowerCase();
    startGlobal = lFull.indexOf(lSearch);
    matchLen = lSearch.length;
  }

  // 4. First 40 chars as a prefix match (handles truncation)
  if (startGlobal === -1 && searchText.length > 40) {
    const prefix = searchText.slice(0, 40).replace(/\s+/g, " ").toLowerCase();
    startGlobal = fullText.toLowerCase().indexOf(prefix);
    matchLen = prefix.length;
  }

  if (startGlobal === -1) return null;

  const endGlobal = startGlobal + matchLen;

  try {
    const range = document.createRange();
    const startNodeInfo = textNodes.find(
      (n) => startGlobal >= n.start && startGlobal < n.start + n.length,
    );
    const endNodeInfo = textNodes.find(
      (n) => endGlobal > n.start && endGlobal <= n.start + n.length,
    );
    if (!startNodeInfo || !endNodeInfo) return null;

    range.setStart(startNodeInfo.node, startGlobal - startNodeInfo.start);
    range.setEnd(
      endNodeInfo.node,
      Math.min(endGlobal - endNodeInfo.start, endNodeInfo.length),
    );

    const rects = Array.from(range.getClientRects());
    if (rects.length === 0) return null;

    // Vertical center of the matched text, relative to refRect.top
    const minY = Math.min(...rects.map((r) => r.top));
    const maxY = Math.max(...rects.map((r) => r.bottom));
    return (minY + maxY) / 2 - refRect.top;
  } catch {
    return null;
  }
}

CanvasNodeComponent.displayName = "CanvasNodeComponent";
