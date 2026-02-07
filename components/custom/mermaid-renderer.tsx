"use client";

import { GitBranch } from "lucide-react";

interface MermaidRendererProps {
  content: string;
  className?: string;
}

/**
 * Fallback MermaidRenderer that displays mermaid source as a styled code block.
 * Once the `mermaid` npm package is installed, this can be upgraded to render
 * actual SVG diagrams using mermaid.render().
 */
export function MermaidRenderer({ content, className = "" }: MermaidRendererProps) {
  return (
    <div className={`rounded-lg border border-border bg-card overflow-hidden ${className}`}>
      <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 border-b border-border text-xs text-muted-foreground">
        <GitBranch className="size-3.5" />
        <span className="font-medium">Mermaid Diagram</span>
      </div>
      <pre className="p-4 text-sm overflow-x-auto whitespace-pre-wrap text-foreground/80">
        <code>{content}</code>
      </pre>
    </div>
  );
}
