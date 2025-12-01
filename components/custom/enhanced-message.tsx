"use client";

import { Message } from "ai";
import { AnimatePresence } from "framer-motion";
import { MessageSquareText } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Markdown } from "./markdown";

// Annotation type for saved "Ask Tara" threads
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
  onAskTara?: (selectedText: string) => void;
  onOpenAnnotation?: (annotationId: string, selectedText: string) => void;
}

export function EnhancedMessage({
  message,
  chatId,
  annotations = [],
  onAskTara,
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

  const handleAskTara = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onAskTara?.(capturedText);
    // Clear selection
    window.getSelection()?.removeAllRanges();
    setHasSelection(false);
  };

  // Calculate position for the "Ask Tara" icon (right of the last line of selection)
  const iconPosition =
    selectionRects.length > 0
      ? {
          top: selectionRects[selectionRects.length - 1].top,
          left: selectionRects[selectionRects.length - 1].right,
          height: selectionRects[selectionRects.length - 1].height,
        }
      : null;

  return (
    <div className="relative group">
      <div ref={containerRef} className="message-content relative z-10">
        <Markdown>{message.content}</Markdown>
      </div>

      {/* Saved Annotation Markers */}
      {annotations.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {annotations.map((annotation) => (
            <button
              key={annotation.id}
              onClick={() =>
                onOpenAnnotation?.(annotation.id, annotation.selectedText)
              }
              className="inline-flex items-center gap-1.5 px-2 py-1 text-xs rounded-full bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors"
              title={`"${annotation.selectedText.slice(0, 50)}${annotation.selectedText.length > 50 ? "..." : ""}"`}
            >
              <MessageSquareText className="size-3" />
              <span className="max-w-[120px] truncate">
                {annotation.selectedText.slice(0, 30)}
                {annotation.selectedText.length > 30 ? "..." : ""}
              </span>
              {annotation.messageCount !== undefined &&
                annotation.messageCount > 0 && (
                  <span className="text-purple-500 dark:text-purple-400">
                    ({annotation.messageCount})
                  </span>
                )}
            </button>
          ))}
        </div>
      )}

      {/* Selection Highlights and "Ask Tara" UI Overlay */}
      {hasSelection && selectionRects.length > 0 && iconPosition && (
        <div
          className="absolute inset-0 pointer-events-none z-20"
          data-selection-overlay="true"
        >
          {/* Light Highlights */}
          {selectionRects.map((rect, i) => (
            <div
              key={i}
              className="absolute bg-purple-100/40 dark:bg-purple-500/20 transition-colors duration-200"
              style={{
                left: rect.left,
                top: rect.top,
                width: rect.width,
                height: rect.height,
              }}
            />
          ))}

          {/* Wire and Button */}
          <div
            className="absolute flex items-center"
            style={{
              left: iconPosition.left,
              top: iconPosition.top,
              height: iconPosition.height,
            }}
          >
            {/* Wire */}
            <div className="w-3 h-px bg-purple-400 dark:bg-purple-500/50 origin-left" />

            {/* "Ask Tara" Button */}
            <button
              onClick={handleAskTara}
              className="pointer-events-auto flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium shadow-sm hover:scale-105 transition-all"
            >
              <MessageSquareText className="size-3" />
              <span>Ask Tara</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
