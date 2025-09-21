"use client";

import { Message } from "ai";
import { AnimatePresence } from "framer-motion";
import { useRef, useState, useCallback } from "react";

import { AnnotationBubble } from "./annotation-bubble";
import { Markdown } from "./markdown";
import { useTextAnnotations } from "./use-text-annotations";

interface EnhancedMessageProps {
  message: Message;
  onAnnotationReply?: (question: string, text: string) => void;
}

export function EnhancedMessage({ message, onAnnotationReply }: EnhancedMessageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [processingAnnotation, setProcessingAnnotation] = useState<string | null>(null);
  
  const {
    annotations,
    activeAnnotation,
    setActiveAnnotation,
    createAnnotation,
    updateAnnotationResponse,
    removeAnnotation,
  } = useTextAnnotations({ containerRef });

  // Removed custom selection context menu and its AI action handler

  const activeAnnotationData = annotations.find(a => a.id === activeAnnotation);

  return (
    <div className="relative">
      <div ref={containerRef} className="message-content">
        <Markdown>{message.content}</Markdown>
      </div>

  {/* Custom selection context menu removed as per requirements */}

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
            isLoading={activeAnnotationData.isLoading || processingAnnotation === activeAnnotationData.id}
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