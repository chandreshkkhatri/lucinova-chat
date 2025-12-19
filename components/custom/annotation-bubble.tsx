"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Loader2, Move, Pin, PinOff } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface AnnotationBubbleProps {
  id: string;
  text: string;
  question: string;
  response: string;
  position: { x: number; y: number };
  onClose: () => void;
  isLoading?: boolean;
}

export function AnnotationBubble({
  id,
  text,
  question,
  response,
  position,
  onClose,
  isLoading = false,
}: AnnotationBubbleProps) {
  const [isPinned, setIsPinned] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState(position);
  const dragRef = useRef<HTMLDivElement>(null);
  const dragStartPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStartPos.current.x;
      const deltaY = e.clientY - dragStartPos.current.y;
      
      setDragPosition({
        x: position.x + deltaX,
        y: position.y + deltaY,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, position]);

  const handleDragStart = (e: React.MouseEvent) => {
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    setIsDragging(true);
  };

  return (
    <motion.div
      ref={dragRef}
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 10 }}
      transition={{ 
        duration: 0.3, 
        ease: [0.4, 0, 0.2, 1],
        scale: { duration: 0.2 }
      }}
      className="fixed z-50 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-blue-200 dark:border-blue-800/50 overflow-hidden backdrop-blur-sm"
      style={{
        left: `${dragPosition.x}px`,
        top: `${dragPosition.y}px`,
        cursor: isDragging ? "grabbing" : "default",
        boxShadow: "0 10px 25px rgba(59, 130, 246, 0.15), 0 0 1px rgba(59, 130, 246, 0.3)",
      }}
    >
      {/* Gradient overlay for depth */}
      <div className="absolute inset-0 opacity-5 bg-gradient-to-br from-blue-500 to-transparent pointer-events-none" />
      
      {/* Header */}
      <div
        className="relative flex items-center justify-between px-3 py-2 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-b border-blue-200 dark:border-blue-800/50"
        onMouseDown={handleDragStart}
        style={{ cursor: isDragging ? "grabbing" : "grab" }}
      >
        <div className="flex items-center gap-2">
          <div className="size-6 rounded-full bg-blue-500 dark:bg-blue-600 flex items-center justify-center animate-pulse">
            <Sparkles className="size-3.5 text-white" />
          </div>
          <span className="text-xs font-semibold text-blue-900 dark:text-blue-100">
            Context Note
          </span>
        </div>
        
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsPinned(!isPinned)}
            className="p-1 hover:bg-blue-200 dark:hover:bg-blue-800/30 rounded-full transition-all duration-200 hover:scale-110"
            title={isPinned ? "Unpin" : "Pin"}
          >
            {isPinned ? (
              <Pin className="size-3.5 text-blue-700 dark:text-blue-300" />
            ) : (
              <PinOff className="size-3.5 text-blue-600 dark:text-blue-400" />
            )}
          </button>
          <button
            onClick={onClose}
            className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full transition-all duration-200 hover:scale-110"
          >
            <X className="size-3.5 text-blue-700 dark:text-blue-300 hover:text-red-600 dark:hover:text-red-400" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="relative p-3 max-h-80 overflow-y-auto">
        {/* Selected text */}
        <div className="mb-3 p-2 bg-gradient-to-r from-gray-50 to-transparent dark:from-gray-900/30 dark:to-transparent rounded-lg border-l-2 border-blue-400 dark:border-blue-600">
          <p className="text-[10px] text-blue-700 dark:text-blue-400 uppercase tracking-wide font-semibold mb-1">
            Selected Text
          </p>
          <p className="text-xs text-gray-700 dark:text-gray-300 italic line-clamp-2">
            &quot;{text}&quot;
          </p>
        </div>

        {/* Question */}
        <div className="mb-2">
          <p className="text-[10px] text-yellow-700 dark:text-yellow-400 uppercase tracking-wide font-semibold mb-1">
            Your Question
          </p>
          <p className="text-xs font-medium text-gray-800 dark:text-gray-200">
            {question}
          </p>
        </div>

        {/* Response */}
        <div>
          <p className="text-[10px] text-yellow-700 dark:text-yellow-400 uppercase tracking-wide font-semibold mb-1">
            AI Response
          </p>
          
          {isLoading ? (
            <div className="flex items-center gap-2 py-3">
              <Loader2 className="size-3 animate-spin text-yellow-600 dark:text-yellow-400" />
              <span className="text-xs text-yellow-700 dark:text-yellow-300">
                Thinking...
              </span>
            </div>
          ) : (
            <div className="prose prose-xs dark:prose-invert max-w-none">
              <div className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {response}
                </ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Paper fold effect */}
      <div className="absolute bottom-0 right-0 size-4">
        <div className="absolute inset-0 bg-yellow-100 dark:bg-yellow-900/20 rotate-45 translate-x-2 translate-y-2" />
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-200 to-yellow-300 dark:from-yellow-800/50 dark:to-yellow-700/50 rotate-45" />
      </div>
    </motion.div>
  );
}