"use client";

import { Message } from "@/lib/chat-utils";
import { MessageSquareText } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Markdown } from "./markdown";

// Annotation type for saved "Ask Lucinova" threads
export interface SavedAnnotation {
  id: string;
  messageId: string;
  selectedText: string;
  messageCount?: number;
}

interface EnhancedMessageProps {
  message: Message;
  chatId: string;
  annotations?: SavedAnnotation[];
  onAskLucinova?: (selectedText: string) => void;
  onOpenAnnotation?: (annotationId: string, selectedText: string) => void;
}

export function EnhancedMessage({
  message,
  annotations = [],
  onAskLucinova,
  onOpenAnnotation,
}: EnhancedMessageProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // State for selection UI
  const [selectionRects, setSelectionRects] = useState<DOMRect[]>([]);
  const [hasSelection, setHasSelection] = useState(false);
  const [capturedText, setCapturedText] = useState<string>("");

  useEffect(() => {
    const handleSelectionChange = () => {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
        setHasSelection(false);
        setSelectionRects([]);
        return;
      }

      const container = containerRef.current;
      if (!container) return;

      const range = sel.getRangeAt(0);

      // Verify selection is within this message container
      if (!container.contains(range.commonAncestorContainer)) {
        return;
      }

      const text = sel.toString().trim();
      if (text.length < 1) {
        setHasSelection(false);
        return;
      }

      setCapturedText(text);
      setHasSelection(true);

      // Get rects relative to viewport
      const clientRects = Array.from(range.getClientRects());
      const containerRect = container.getBoundingClientRect();

      // Convert to relative coordinates
      const relativeRects = clientRects.map(
        (r) =>
          new DOMRect(
            r.left - containerRect.left,
            r.top - containerRect.top,
            r.width,
            r.height
          )
      );

      setSelectionRects(relativeRects);
    };

    document.addEventListener("selectionchange", handleSelectionChange);

    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, []);

  const handleAskLucinova = (e: React.MouseEvent) => {
    e.preventDefault();
    onAskLucinova?.(capturedText);
    // Clear selection
    window.getSelection()?.removeAllRanges();
    setHasSelection(false);
  };

  // Button position: centered above the first highlighted line
  const firstRect = selectionRects.length > 0 ? selectionRects[0] : null;
  const buttonX = firstRect ? firstRect.left + firstRect.width / 2 : 0;
  const buttonY = firstRect ? firstRect.top : 0;

  // Fix for issues where content comes in as stringified objects
  let content = "";
  if ((message as any).parts) {
    content = (message as any).parts
      .filter((p: any) => p.type === "text")
      .map((p: any) => p.text)
      .join("");
  }

  if (!content) {
    const rawContent = (message as any).content;
    content =
      typeof rawContent === "string"
        ? rawContent.startsWith("[object Object]")
          ? ""
          : rawContent
        : rawContent == null
        ? ""
        : JSON.stringify(rawContent);
  }

  return (
    <div className="relative group">
      <div
        ref={containerRef}
        className="message-content relative max-w-full break-words prose prose-sm dark:prose-invert prose-p:leading-relaxed prose-pre:p-0"
      >
        <Markdown>{content}</Markdown>

        {(message as any).experimental_attachments &&
          (message as any).experimental_attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {(message as any).experimental_attachments.map(
                (attachment: any, index: number) => (
                  <div key={index} className="relative max-w-[300px] w-full">
                    {attachment.contentType?.startsWith("image") ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={attachment.url}
                        alt={attachment.name ?? `Attachment ${index + 1}`}
                        className="rounded-lg w-full h-auto object-contain border border-border bg-card"
                      />
                    ) : (
                      <div className="flex items-center gap-2 p-3 rounded-lg border border-border bg-muted">
                        <div className="size-8 rounded bg-primary/20 flex items-center justify-center text-primary font-bold text-xs uppercase">
                          {attachment.contentType?.split("/")[1] || "FILE"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate text-foreground">
                            {attachment.name || "Attachment"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {attachment.contentType}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              )}
            </div>
          )}
      </div>

      {/* Saved Annotation Overlays */}
      {annotations.length > 0 && (
        <SavedAnnotationsOverlay
          annotations={annotations}
          containerRef={containerRef}
          onOpenAnnotation={onOpenAnnotation}
        />
      )}

      {/* Selection Highlights and "Ask Lucinova" UI Overlay */}
      {hasSelection && selectionRects.length > 0 && firstRect && (
        <div
          className="absolute inset-0 pointer-events-none z-20"
          data-selection-overlay="true"
        >
          {/* Light Highlights */}
          {selectionRects.map((rect, i) => (
            <div
              key={i}
              className="absolute bg-purple-100/40 dark:bg-purple-500/20 transition-colors duration-200 mix-blend-multiply dark:mix-blend-screen"
              style={{
                left: rect.left,
                top: rect.top,
                width: rect.width,
                height: rect.height,
              }}
            />
          ))}

          {/* "Ask Lucinova" Button - above first highlighted line */}
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: buttonX,
              top: buttonY,
              transform: "translate(-50%, -100%)",
            }}
          >
            <button
              onClick={handleAskLucinova}
              className="pointer-events-auto flex items-center gap-1 px-2 py-0.5 mb-1 rounded-full bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium shadow-md hover:scale-105 transition-all whitespace-nowrap"
            >
              <MessageSquareText className="size-3" />
              <span>Ask Lucinova</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Sub-component to handle rendering of saved annotations
function SavedAnnotationsOverlay({
  annotations,
  containerRef,
  onOpenAnnotation,
}: {
  annotations: SavedAnnotation[];
  containerRef: React.RefObject<HTMLDivElement>;
  onOpenAnnotation?: (id: string, text: string) => void;
}) {
  const [annotationRects, setAnnotationRects] = useState<
    Map<
      string,
      {
        rects: DOMRect[];
        buttonX: number;
        buttonY: number;
      }
    >
  >(new Map());

  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Use useEffect to calculate positions after render
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    const newMap = new Map();

    annotations.forEach((ann) => {
      const ranges = findTextRanges(container, ann.selectedText);

      if (ranges.length > 0) {
        const range = ranges[0];
        const clientRects = Array.from(range.getClientRects());

        const relativeRects = clientRects.map(
          (r) =>
            new DOMRect(
              r.left - containerRect.left,
              r.top - containerRect.top,
              r.width,
              r.height
            )
        );

        if (relativeRects.length > 0) {
          const lastRect = relativeRects[relativeRects.length - 1];

          newMap.set(ann.id, {
            rects: relativeRects,
            buttonX: lastRect.right,
            buttonY: lastRect.top + lastRect.height / 2,
          });
        }
      }
    });

    setAnnotationRects(newMap);
  }, [annotations, containerRef]);

  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {annotations.map((ann) => {
        const data = annotationRects.get(ann.id);
        if (!data) return null;

        const isHovered = hoveredId === ann.id;

        return (
          <div key={ann.id}>
            {/* Highlights */}
            {data.rects.map((rect, i) => (
              <div
                key={i}
                className={`absolute transition-colors duration-200 ${
                  isHovered
                    ? "bg-amber-200/60 dark:bg-amber-500/40 mix-blend-multiply dark:mix-blend-screen"
                    : "bg-amber-100/40 dark:bg-amber-500/20 mix-blend-multiply dark:mix-blend-screen"
                }`}
                style={{
                  left: rect.left,
                  top: rect.top,
                  width: rect.width,
                  height: rect.height,
                }}
              />
            ))}

            {/* Superscript footnote icon at end of highlighted text */}
            <div
              className="absolute"
              style={{
                left: data.buttonX,
                top: data.buttonY,
                transform: "translate(1px, -100%)",
              }}
              onMouseEnter={() => setHoveredId(ann.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenAnnotation?.(ann.id, ann.selectedText);
                }}
                className={`pointer-events-auto inline-flex items-center justify-center rounded-sm transition-all ${
                  isHovered
                    ? "text-amber-600 dark:text-amber-400 scale-125"
                    : "text-amber-400 dark:text-amber-500/70 scale-100"
                }`}
                title="View thread"
              >
                <MessageSquareText className="size-3" />
                {ann.messageCount !== undefined && ann.messageCount > 0 && (
                  <span className={`text-[8px] font-bold leading-none -ml-0.5 ${
                    isHovered
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-amber-400 dark:text-amber-500/70"
                  }`}>
                    {ann.messageCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Helper to find text ranges in DOM
const findTextRanges = (
  container: HTMLElement,
  searchText: string
): Range[] => {
  const ranges: Range[] = [];
  if (!searchText) return ranges;

  const walker = document.createTreeWalker(
    container,
    NodeFilter.SHOW_TEXT,
    null
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

  const normalizedFullText = fullText.replace(/\s+/g, " ");
  const normalizedSearchText = searchText.replace(/\s+/g, " ");

  let searchIndex = 0;
  while (true) {
    const foundIndex = normalizedFullText.indexOf(
      normalizedSearchText,
      searchIndex
    );
    if (foundIndex === -1) break;

    const strictIndex = fullText.indexOf(searchText, searchIndex);
    if (strictIndex !== -1) {
      const startGlobal = strictIndex;
      const endGlobal = strictIndex + searchText.length;

      const range = document.createRange();
      const startNodeInfo = textNodes.find(
        (n) => startGlobal >= n.start && startGlobal < n.start + n.length
      );
      const endNodeInfo = textNodes.find(
        (n) => endGlobal > n.start && endGlobal <= n.start + n.length
      );

      if (startNodeInfo && endNodeInfo) {
        range.setStart(startNodeInfo.node, startGlobal - startNodeInfo.start);
        if (endGlobal === endNodeInfo.start + endNodeInfo.length) {
          range.setEnd(endNodeInfo.node, endNodeInfo.length);
        } else {
          range.setEnd(endNodeInfo.node, endGlobal - endNodeInfo.start);
        }
        ranges.push(range);
      }
      searchIndex = endGlobal;
    } else {
      break;
    }
  }

  return ranges;
};
