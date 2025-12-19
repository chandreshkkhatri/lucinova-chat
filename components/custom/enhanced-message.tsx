"use client";

import { Message } from "ai";
import { MessageSquareText } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Markdown } from "./markdown";

// Annotation type for saved "Ask Taara" threads
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
  onAskTaara?: (selectedText: string) => void;
  onOpenAnnotation?: (annotationId: string, selectedText: string) => void;
}

export function EnhancedMessage({
  message,
  chatId,
  annotations = [],
  onAskTaara,
  onOpenAnnotation,
}: EnhancedMessageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isUser = message.role === "user";

  // State for selection UI
  const [selectionRects, setSelectionRects] = useState<DOMRect[]>([]);
  const [hasSelection, setHasSelection] = useState(false);
  const [capturedText, setCapturedText] = useState<string>("");
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });

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
      setContainerDimensions({ width: containerRect.width, height: containerRect.height });

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

  const handleAskTaara = (e: React.MouseEvent) => {
    e.preventDefault();
    onAskTaara?.(capturedText);
    // Clear selection
    window.getSelection()?.removeAllRanges();
    setHasSelection(false);
  };

  // Calculate highlight rect (last line) to connect wire from
  const lastRect = selectionRects.length > 0 ? selectionRects[selectionRects.length - 1] : null;
  
  // Wire positioning - curve above the text to avoid strike-through effect
  // Start from the top corner of the last rect
  const wireStartX = lastRect ? (isUser ? lastRect.left : lastRect.right) : 0;
  const wireStartY = lastRect ? lastRect.top - 2 : 0; // Start from top of text, not middle

  // Wire End Point (outside bubble)
  const wireEndX = isUser ? -40 : containerDimensions.width + 40;
  const wireEndY = wireStartY; // Keep horizontal alignment

  // Control point for the curve (creates an arc above the text)
  const curveHeight = 15; // How high the curve goes above the text
  const controlX = (wireStartX + wireEndX) / 2;
  const controlY = wireStartY - curveHeight;

  return (
    <div className="relative group">
      <div ref={containerRef} className="message-content relative z-10">
        <Markdown>{message.content}</Markdown>
      </div>

      {/* Saved Annotation Overlays */}
      {annotations.length > 0 && (
        <SavedAnnotationsOverlay
          annotations={annotations}
          containerRef={containerRef}
          onOpenAnnotation={onOpenAnnotation}
          isUser={isUser}
        />
      )}

      {/* Selection Highlights and "Ask Taara" UI Overlay */}
      {hasSelection && selectionRects.length > 0 && lastRect && (
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

          {/* Wire SVG - curved path that goes above the text */}
          <svg className="absolute overflow-visible inset-0 pointer-events-none">
            <path
              d={`M ${wireStartX} ${wireStartY} Q ${controlX} ${controlY} ${wireEndX} ${wireEndY}`}
              className="stroke-purple-400 dark:stroke-purple-500/70"
              strokeWidth="1.5"
              fill="none"
            />
            {/* Dot at start */}
            <circle cx={wireStartX} cy={wireStartY} r="2.5" className="fill-purple-400 dark:fill-purple-500/70" />
          </svg>

          {/* "Ask Taara" Button */}
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: wireEndX,
              top: wireEndY,
              transform: isUser ? "translate(-100%, -50%)" : "translate(0, -50%)",
            }}
          >
            <button
              onClick={handleAskTaara}
              className="pointer-events-auto flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium shadow-sm hover:scale-105 transition-all whitespace-nowrap"
            >
              <MessageSquareText className="size-3" />
              <span>Ask Taara</span>
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
  isUser,
}: {
  annotations: SavedAnnotation[];
  containerRef: React.RefObject<HTMLDivElement>;
  onOpenAnnotation?: (id: string, text: string) => void;
  isUser: boolean;
}) {
  const [annotationRects, setAnnotationRects] = useState<
    Map<string, { 
      rects: DOMRect[]; 
      wireStart: { x: number; y: number }; 
      wireEnd: { x: number; y: number };
      controlPoint: { x: number; y: number };
    }>
  >(new Map());
  
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Use useEffect to calculate positions after render
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    const newMap = new Map();

    annotations.forEach((ann, index) => {
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
          
          // Start from top corner of the text
          const startX = isUser ? lastRect.left : lastRect.right;
          const startY = lastRect.top - 2;
          
          // End outside the bubble
          const endX = isUser ? -30 : containerRect.width + 30;
          // Stagger vertically if multiple annotations to avoid overlap
          const endY = startY + (index * 20);

          // Control point for curve (arc above text)
          const curveHeight = 12 + (index * 5);
          const controlX = (startX + endX) / 2;
          const controlY = Math.min(startY, endY) - curveHeight;

          newMap.set(ann.id, {
            rects: relativeRects,
            wireStart: { x: startX, y: startY },
            wireEnd: { x: endX, y: endY },
            controlPoint: { x: controlX, y: controlY },
          });
        }
      }
    });

    setAnnotationRects(newMap);
  }, [annotations, containerRef, isUser]);

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

            {/* Wire SVG - curved path that arcs above the text */}
            <svg className="absolute overflow-visible inset-0 pointer-events-none">
              <path
                d={`M ${data.wireStart.x} ${data.wireStart.y} Q ${data.controlPoint.x} ${data.controlPoint.y} ${data.wireEnd.x} ${data.wireEnd.y}`}
                className={`transition-all duration-200 fill-none ${
                  isHovered
                    ? "stroke-amber-400 dark:stroke-amber-500"
                    : "stroke-amber-300 dark:stroke-amber-700/60"
                }`}
                strokeWidth={isHovered ? "2" : "1.5"}
              />
              {/* Dot at start point */}
              <circle 
                cx={data.wireStart.x} 
                cy={data.wireStart.y} 
                r={isHovered ? 3 : 2} 
                className={`transition-all duration-200 ${
                  isHovered ? "fill-amber-400 dark:fill-amber-500" : "fill-amber-300 dark:fill-amber-700/60"
                }`} 
              />
            </svg>

            {/* Icon Button - Positioned at wire end */}
            <div
              className="absolute flex items-center justify-center"
              style={{
                left: data.wireEnd.x,
                top: data.wireEnd.y,
                transform: isUser ? "translate(-100%, -50%)" : "translate(0, -50%)",
              }}
              onMouseEnter={() => setHoveredId(ann.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenAnnotation?.(ann.id, ann.selectedText);
                }}
                className={`pointer-events-auto flex items-center justify-center size-6 rounded-full border shadow-sm transition-all ${
                  isHovered
                    ? "bg-amber-100 dark:bg-amber-900 border-amber-400 text-amber-700 dark:text-amber-300 scale-110"
                    : "bg-white dark:bg-gray-800 border-amber-200 dark:border-amber-800/50 text-amber-500 dark:text-amber-400/70 scale-100"
                }`}
                title="View thread"
              >
                <MessageSquareText className="size-3.5" />
              </button>
              
              {/* Message Count Badge */}
              {ann.messageCount !== undefined && ann.messageCount > 0 && (
                 <div className={`absolute -top-2 -right-2 text-[10px] font-bold rounded-full px-1.5 py-0.5 ${
                    isHovered
                      ? "bg-amber-500 text-white"
                      : "bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400"
                 }`}>
                   {ann.messageCount}
                 </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Helper to find text ranges in DOM
const findTextRanges = (container: HTMLElement, searchText: string): Range[] => {
  const ranges: Range[] = [];
  if (!searchText) return ranges;

  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null);
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

  const normalizedFullText = fullText.replace(/\s+/g, ' ');
  const normalizedSearchText = searchText.replace(/\s+/g, ' ');
  
  let searchIndex = 0;
  while (true) {
    const foundIndex = normalizedFullText.indexOf(normalizedSearchText, searchIndex);
    if (foundIndex === -1) break;

    const strictIndex = fullText.indexOf(searchText, searchIndex);
    if (strictIndex !== -1) {
        const startGlobal = strictIndex;
        const endGlobal = strictIndex + searchText.length;
        
        const range = document.createRange();
        const startNodeInfo = textNodes.find(n => startGlobal >= n.start && startGlobal < n.start + n.length);
        const endNodeInfo = textNodes.find(n => endGlobal > n.start && endGlobal <= n.start + n.length);

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
