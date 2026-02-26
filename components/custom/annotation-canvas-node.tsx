"use client";

import { Handle, Position, NodeProps } from "@xyflow/react";
import { MessageSquareText, Reply } from "lucide-react";
import { memo } from "react";

import { SavedAnnotation } from "./enhanced-message";

// ── Data shape for the annotation node ──────────────────────────────
export type AnnotationNodeData = {
  annotation: SavedAnnotation;
  onOpenAnnotation?: (annotationId: string, selectedText: string) => void;
};

/**
 * A compact React Flow node that represents a single annotation thread.
 * Shows the selected-text quote and (if available) the first reply in one card.
 * Clicking it opens the annotation thread in the right sidebar.
 */
export const AnnotationCanvasNode = memo(({ data: rawData }: NodeProps) => {
  const data = rawData as AnnotationNodeData;
  const { annotation, onOpenAnnotation } = data;

  return (
    <div className="group relative min-w-[220px] max-w-[300px]">
      {/* Incoming handle from parent message (left side) */}
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-purple-400 !w-2.5 !h-2.5 !-left-1"
      />

      {/* Card */}
      <button
        onClick={() =>
          onOpenAnnotation?.(annotation.id, annotation.selectedText)
        }
        className="w-full text-left rounded-xl border border-purple-300/40 dark:border-purple-700/40 bg-purple-50/80 dark:bg-purple-900/20 backdrop-blur-sm shadow-sm hover:shadow-md hover:border-purple-400/60 dark:hover:border-purple-600/60 transition-all duration-200 p-3"
      >
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <div className="size-6 rounded-md bg-purple-100 dark:bg-purple-800/40 flex items-center justify-center shrink-0">
            <MessageSquareText className="size-3.5 text-purple-600 dark:text-purple-400" />
          </div>
          <span className="text-[11px] font-semibold text-purple-700 dark:text-purple-300 uppercase tracking-wide">
            Annotation
          </span>
          {(annotation.messageCount ?? 0) > 0 && (
            <span className="ml-auto text-[10px] font-medium text-purple-500 dark:text-purple-400 bg-purple-100 dark:bg-purple-800/30 rounded-full px-1.5 py-0.5">
              {annotation.messageCount} msg{annotation.messageCount === 1 ? "" : "s"}
            </span>
          )}
        </div>

        {/* Selected text quote */}
        <div className="text-xs text-foreground/70 italic border-l-2 border-purple-400 dark:border-purple-500 pl-2 line-clamp-3">
          &ldquo;{annotation.selectedText}&rdquo;
        </div>

        {/* First reply preview (inline, no separate node) */}
        {annotation.firstMessageText && (
          <div className="mt-2 pt-2 border-t border-purple-200/40 dark:border-purple-700/30">
            <div className="flex items-start gap-1.5">
              <Reply className="size-3 text-purple-400 dark:text-purple-500 shrink-0 mt-0.5" />
              <p className="text-xs text-foreground/80 line-clamp-2 leading-relaxed">
                {annotation.firstMessageText}
              </p>
            </div>
          </div>
        )}
      </button>
    </div>
  );
});

AnnotationCanvasNode.displayName = "AnnotationCanvasNode";
