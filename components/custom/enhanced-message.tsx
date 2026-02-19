"use client";

import { MessageSquareText } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Message } from "@/lib/chat-utils";

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
          className="absolute inset-0 pointer-events-none z-20 group"
          data-selection-overlay="true"
        >
          {/* Light Highlights — glow on hover */}
          {selectionRects.map((rect, i) => (
            <div
              key={i}
              className="absolute bg-purple-200/50 dark:bg-purple-500/25 group-hover:bg-purple-300/70 dark:group-hover:bg-purple-400/50 transition-all duration-200 mix-blend-multiply dark:mix-blend-screen rounded-sm"
              style={{
                left: rect.left,
                top: rect.top,
                width: rect.width,
                height: rect.height,
                boxShadow: "0 0 0 0 transparent",
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
              className="pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 mb-1.5 rounded-full bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold shadow-lg hover:shadow-purple-500/40 hover:scale-105 transition-all whitespace-nowrap"
            >
              <MessageSquareText className="size-4" />
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
        startX: number;
        startY: number;
        endY: number;
      }
    >
  >(new Map());

  // Calculate container width to position icons at the right edge
  const [containerWidth, setContainerWidth] = useState(0);

  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Use useEffect to calculate positions after render
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    
    const updatePositions = () => {
      const containerRect = container.getBoundingClientRect();
      setContainerWidth(containerRect.width);
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
            const firstRect = relativeRects[0];

            newMap.set(ann.id, {
              rects: relativeRects,
              // Start of the wire at the end of the first line, slightly above center
              // Using .top aligns it with the top edge (as requested "above the line")
              startX: firstRect.right,
              startY: firstRect.top, 
              // End of the wire at the icon (pushed out to the right)
              // Add offset to make room for the "bend up" (negative y)
              endY: firstRect.top - 8, 
            });
          }
        }
      });

      setAnnotationRects(newMap);
    };

    updatePositions();
    
    // Update on resize
    const observer = new ResizeObserver(updatePositions);
    observer.observe(container);
    
    return () => observer.disconnect();
  }, [annotations, containerRef]);

  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      <svg className="absolute inset-0 size-full overflow-visible pointer-events-none z-0">
        {annotations.map((ann) => {
          const data = annotationRects.get(ann.id);
          if (!data) return null;
          const isHovered = hoveredId === ann.id;
          
          // Bezier curve from text end to icon
          // Control points create a smooth "wire" shape with a "vertical start, upward rise, then curve down"
          const startX = data.startX;
          const startY = data.startY;
          const endX = containerWidth + 48; // Pushed out further
          const endY = data.endY + 8; 
          
          // CP1: Go UP from the start point (subtle rise now)
          const controlPoint1X = startX; 
          const controlPoint1Y = startY - 8; // Small rise (user said "barely needs to be curved down")
          
          // CP2: Approach the end point from above/left (subtle)
          const controlPoint2X = endX - 24; 
          const controlPoint2Y = endY - 4; // Come from slightly above

          return (
            <path
              key={`wire-${ann.id}`}
              d={`M ${startX} ${startY} C ${controlPoint1X} ${controlPoint1Y}, ${controlPoint2X} ${controlPoint2Y}, ${endX} ${endY}`}
              fill="none"
              stroke={isHovered ? "rgb(217 119 6)" : "rgb(251 191 36)"} // Amber-600 / Amber-400
              strokeWidth={isHovered ? 2.5 : 1.5}
              className="transition-all duration-300 pointer-events-none"
              style={{ opacity: isHovered ? 1 : 0.6 }}
            />
          );
        })}
      </svg>

      {annotations.map((ann) => {
        const data = annotationRects.get(ann.id);
        if (!data) return null;

        const isHovered = hoveredId === ann.id;
        // Match the wire's endY logic
        const iconTop = data.endY + 8;

        return (
          <div key={ann.id} className="group">
            {/* Highlights - interactive now */}
            {data.rects.map((rect, i) => (
              <div
                key={i}
                onMouseEnter={() => setHoveredId(ann.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenAnnotation?.(ann.id, ann.selectedText);
                }}
                className={`absolute transition-all duration-200 rounded-sm cursor-pointer pointer-events-auto ${
                  isHovered
                    ? "bg-amber-300/50 dark:bg-amber-500/40 mix-blend-multiply dark:mix-blend-screen shadow-[0_0_8px_rgba(251,191,36,0.4)]"
                    : "bg-amber-200/30 dark:bg-amber-500/20 mix-blend-multiply dark:mix-blend-screen"
                }`}
                style={{
                  left: rect.left,
                  top: rect.top,
                  width: rect.width,
                  height: rect.height,
                }}
              />
            ))}

            {/* Icon at the right edge connected by wire */}
            <div
              className="absolute pointer-events-auto z-10"
              style={{
                right: -48, // Match endX offset
                top: iconTop,
                transform: "translate(0, -50%)", // Center vertically on the line
              }}
              onMouseEnter={() => setHoveredId(ann.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <button
                id={`annotation-icon-${ann.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenAnnotation?.(ann.id, ann.selectedText);
                }}
                className={`flex items-center justify-center rounded-full p-2 shadow-sm border transition-all ${
                  isHovered
                    ? "bg-amber-200 dark:bg-amber-700 border-amber-400 dark:border-amber-500 text-amber-800 dark:text-amber-100 scale-115 shadow-md ring-2 ring-amber-300 dark:ring-amber-600"
                    : "bg-amber-100 dark:bg-amber-900/80 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 scale-100 hover:bg-amber-200 dark:hover:bg-amber-800"
                }`}
                title="View thread"
              >
                <MessageSquareText className="size-5" />
                {ann.messageCount !== undefined && ann.messageCount > 0 && (
                  <span className="ml-1 text-[10px] font-bold leading-none">
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
