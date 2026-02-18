"use client";

import { Sparkles } from "lucide-react";
import { useState } from "react";

interface PendingAnnotationViewProps {
  selectedText: string;
  messageId: string;
  chatId: string;
  onClose: () => void;
  onCreateAnnotation: (firstMessage: string) => Promise<string | null>;
  onAnnotationCreated: (annotationId: string, selectedText: string) => void;
  className?: string;
}

export function PendingAnnotationView({
  selectedText,
  messageId,
  chatId,
  onClose,
  onCreateAnnotation,
  onAnnotationCreated,
  className = "",
}: PendingAnnotationViewProps) {
  const [input, setInput] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const submitQuestion = async (question: string) => {
    if (!question.trim() || isCreating) return;
    setIsCreating(true);
    try {
      const annotationId = await onCreateAnnotation(question.trim());
      if (annotationId) {
        onAnnotationCreated(annotationId, selectedText);
      } else {
        setIsCreating(false);
      }
    } catch (error) {
      console.error("Failed to create annotation:", error);
      setIsCreating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitQuestion(input);
  };

  return (
    <div className={`flex flex-col bg-secondary h-full max-h-full overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-border bg-card flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
            <Sparkles className="size-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">Ask Lucinova</h2>
            <p className="text-xs text-muted-foreground">New annotation</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted text-muted-foreground" aria-label="Close">
          ×
        </button>
      </div>

      {/* Selected Text Display */}
      <div className="px-4 py-3 bg-purple-50 dark:bg-purple-900/20 border-b border-purple-100 dark:border-purple-800/30 shrink-0">
        <div className="text-sm italic text-foreground/80 bg-card rounded-lg px-4 py-2 border-l-4 border-purple-400 dark:border-purple-500 max-h-24 overflow-y-auto">
          {'"'}{selectedText}{'"'}
        </div>
      </div>

      {/* Empty state with suggestions */}
      <div className="flex-1 overflow-y-auto p-4 bg-card min-h-0">
        <div className="text-center max-w-md mx-auto py-8">
          <div className="size-12 mx-auto mb-4 rounded-xl bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800 flex items-center justify-center">
            <Sparkles className="size-6 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Ask about this text</h3>
          <p className="text-muted-foreground mb-6 text-sm">What would you like to know about the selected text?</p>

          <div className="flex flex-col gap-2 mb-4">
            <button
              onClick={() => submitQuestion("Can you explain this in simpler terms?")}
              disabled={isCreating}
              className="p-3 text-left rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-50"
            >
              <p className="text-sm text-foreground/80">Explain this in simpler terms</p>
            </button>
            <button
              onClick={() => submitQuestion("What are the key points here?")}
              disabled={isCreating}
              className="p-3 text-left rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-50"
            >
              <p className="text-sm text-foreground/80">What are the key points?</p>
            </button>
            <button
              onClick={() => submitQuestion("Can you give me an example?")}
              disabled={isCreating}
              className="p-3 text-left rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-50"
            >
              <p className="text-sm text-foreground/80">Give me an example</p>
            </button>
          </div>

          {isCreating && (
            <p className="text-sm text-muted-foreground animate-pulse">Creating annotation...</p>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-border p-3 sm:p-4 shrink-0 bg-card">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about this text..."
            className="flex-1 px-4 py-2 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
            disabled={isCreating}
            autoFocus
          />
          <button
            type="submit"
            disabled={!input.trim() || isCreating}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-muted disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm whitespace-nowrap"
          >
            {isCreating ? "..." : "Ask"}
          </button>
        </form>
      </div>
    </div>
  );
}

