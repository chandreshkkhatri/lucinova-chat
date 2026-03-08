import { useEffect, useRef, RefObject } from "react";

export function useScrollToBottom<T extends HTMLElement>(): [
  RefObject<T>,
  RefObject<T>,
] {
  const containerRef = useRef<T>(null);
  const endRef = useRef<T>(null);

  useEffect(() => {
    const container = containerRef.current;
    const end = endRef.current;

    if (container && end) {
      const observer = new MutationObserver((mutations) => {
        // Only scroll if nodes were added (new messages)
        // Filter out selection overlay elements to prevent scrolling on text selection
        const hasRelevantAddedNodes = mutations.some((m) => {
          if (m.addedNodes.length === 0) return false;

          for (const node of Array.from(m.addedNodes)) {
            if (node instanceof HTMLElement) {
              // Skip if this node is a selection overlay
              if (node.dataset?.selectionOverlay === "true") {
                continue;
              }
              // Skip if parent/ancestor is a selection overlay
              if (node.closest("[data-selection-overlay]")) {
                continue;
              }
              return true; // A real node (like a new message)
            }
            // For text nodes, check if parent is inside selection overlay
            if (node.parentElement?.closest("[data-selection-overlay]")) {
              continue;
            }
            return true;
          }
          return false;
        });

        // Only auto-scroll if the user is already near the bottom (within 100px).
        // This prevents involuntary scrolling when annotation dots or other
        // non-message nodes are added while the user is reading older content.
        const isNearBottom =
          container.scrollHeight - container.scrollTop - container.clientHeight < 100;

        if (hasRelevantAddedNodes && isNearBottom) {
          end.scrollIntoView({ behavior: "instant", block: "end" });
        }
      });

      observer.observe(container, {
        childList: true,
        subtree: true,
        // Removing attributes and characterData to prevent scrolling on selection/highlighting
        attributes: false,
        characterData: false,
      });

      return () => observer.disconnect();
    }
  }, []);

  return [containerRef, endRef];
}
