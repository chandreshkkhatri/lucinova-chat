"use client";

import { Message } from "ai";
import { AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";

import { AnnotationBubble } from "./annotation-bubble";
import { Markdown } from "./markdown";
import { useTextAnnotations } from "./use-text-annotations";

interface EnhancedMessageProps {
  message: Message;
  onAnnotationReply?: (question: string, text: string) => void;
  onAskTara?: () => void;
}

export function EnhancedMessage({
  message,
  onAnnotationReply,
  onAskTara,
}: EnhancedMessageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [processingAnnotation, setProcessingAnnotation] = useState<
    string | null
  >(null);
  const [chipVisible, setChipVisible] = useState(false);
  const [chipPos, setChipPos] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [hasSelection, setHasSelection] = useState(false);

  const {
    annotations,
    activeAnnotation,
    setActiveAnnotation,
    createAnnotation,
    updateAnnotationResponse,
    removeAnnotation,
  } = useTextAnnotations({ containerRef });

  // Removed custom selection context menu and its AI action handler

  // Minimal selection chip logic
  useEffect(() => {
    const handleSelectionEnd = (e: MouseEvent | TouchEvent) => {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) {
        setChipVisible(false);
        setHasSelection(false);
        return;
      }

      const text = sel.toString().trim();
      if (text.length < 2) {
        setChipVisible(false);
        setHasSelection(false);
        return;
      }

      // Ensure selection is inside this message container
      const range = sel.getRangeAt(0);
      const container = containerRef.current;
      if (!container) return;
      const common = range.commonAncestorContainer as Node;
      if (
        !container.contains(
          common.nodeType === 1 ? common : (common.parentNode as Node)
        )
      ) {
        setChipVisible(false);
        setHasSelection(false);
        return;
      }

      const selRect = range.getBoundingClientRect();
      const contRect = container.getBoundingClientRect();

      // Position chip centered below the selection inside container
      const x = selRect.left - contRect.left + selRect.width / 2;
      const y = selRect.bottom - contRect.top + 8; // 8px gap
      setChipPos({ x, y });
      setChipVisible(true);
      setHasSelection(true);
    };

    const handleSelectionChange = () => {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0 || sel.toString().trim().length === 0) {
        setChipVisible(false);
        setHasSelection(false);
      }
    };

    const handleScrollOrClick = (e: Event) => {
      const target = e.target as Node | null;
      if (
        target &&
        containerRef.current &&
        containerRef.current.contains(target)
      ) {
        // allow interactions inside container; do not forcibly hide
        return;
      }
      setChipVisible(false);
    };

    document.addEventListener("mouseup", handleSelectionEnd);
    document.addEventListener("touchend", handleSelectionEnd, {
      passive: true,
    });
    document.addEventListener("selectionchange", handleSelectionChange);
    document.addEventListener("scroll", handleScrollOrClick, true);
    document.addEventListener("mousedown", handleScrollOrClick);
    document.addEventListener("touchstart", handleScrollOrClick, {
      passive: true,
    });

    return () => {
      document.removeEventListener("mouseup", handleSelectionEnd);
      document.removeEventListener("touchend", handleSelectionEnd as any);
      document.removeEventListener("selectionchange", handleSelectionChange);
      document.removeEventListener("scroll", handleScrollOrClick, true);
      document.removeEventListener("mousedown", handleScrollOrClick);
      document.removeEventListener("touchstart", handleScrollOrClick as any);
    };
  }, []);

  const activeAnnotationData = annotations.find(
    (a) => a.id === activeAnnotation
  );

  return (
    <div className="relative">
      <div ref={containerRef} className="message-content">
        <Markdown>{message.content}</Markdown>
      </div>

      {/* Custom selection context menu removed as per requirements */}

      {/* Selection chip */}
      {chipVisible && (
        <button
          type="button"
          onClick={() => {
            onAskTara?.();
            setChipVisible(false);
            // Clear selection so UX feels done
            try {
              window.getSelection()?.removeAllRanges();
            } catch {}
          }}
          className="absolute -translate-x-1/2 z-10 px-2.5 py-1 text-xs rounded-full bg-blue-600 text-white shadow-sm hover:bg-blue-700 active:scale-[0.98] transition"
          style={{ left: chipPos.x, top: chipPos.y }}
        >
          <span className="inline-flex items-center gap-1">
            <Sparkles className="size-3 text-white/90" />
            Ask Tara
          </span>
        </button>
      )}

      {/* Annotation Bubbles */}
      <AnimatePresence>
        {activeAnnotationData && (
          <AnnotationBubble
            key={activeAnnotationData.id}
            id={activeAnnotationData.id}
            text={activeAnnotationData.text}
            question={activeAnnotationData.question}
            response={activeAnnotationData.response}
            position={activeAnnotationData.position}
            onClose={() => {
              setActiveAnnotation(null);
              removeAnnotation(activeAnnotationData.id);
            }}
            isLoading={
              activeAnnotationData.isLoading ||
              processingAnnotation === activeAnnotationData.id
            }
          />
        )}
      </AnimatePresence>

      <style jsx global>{`
        .annotation-highlight {
          position: relative;
          background: linear-gradient(
            180deg,
            transparent 60%,
            rgba(59, 130, 246, 0.15) 60%
          );
          border-bottom: 2px solid rgba(59, 130, 246, 0.3);
          padding: 0 3px;
          margin: 0 1px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border-radius: 2px;
        }

        .annotation-highlight:hover {
          background: linear-gradient(
            180deg,
            transparent 60%,
            rgba(59, 130, 246, 0.25) 60%
          );
          border-bottom-color: rgba(59, 130, 246, 0.6);
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(59, 130, 246, 0.1);
        }

        .annotation-highlight::after {
          content: "💬";
          position: absolute;
          top: -10px;
          right: -10px;
          font-size: 10px;
          opacity: 0;
          transform: scale(0.8);
          transition: all 0.2s ease;
        }

        .annotation-highlight:hover::after {
          opacity: 1;
          transform: scale(1);
        }
      `}</style>
    </div>
  );
}
