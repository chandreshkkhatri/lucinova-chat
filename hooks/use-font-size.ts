import { useState, useEffect, useCallback, useSyncExternalStore } from "react";

export type FontSize = "small" | "medium" | "large";

// ── Shared cross-component synchronization ──────────────────────────
// Every `useFontSize()` hook subscribes here so that when *any* instance
// calls `setFontSize`, all other instances re-render with the new value.
const listeners = new Set<() => void>();

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function getSnapshot(): FontSize {
  const stored = localStorage.getItem("app-font-size") as FontSize | null;
  return stored && ["small", "medium", "large"].includes(stored)
    ? stored
    : "medium";
}

function getServerSnapshot(): FontSize {
  return "medium";
}

export function useFontSize() {
  const fontSize = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Keep isMounted for hydration-safe conditional rendering
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const setFontSize = useCallback((size: FontSize) => {
    localStorage.setItem("app-font-size", size);
    // Notify all subscribers (other useFontSize hooks across the app)
    listeners.forEach((l) => l());
  }, []);

  const getFontSizeClass = useCallback(() => {
    switch (fontSize) {
      case "small":
        return "text-sm"; // 14px base
      case "large":
        return "text-xl"; // 20px base
      case "medium":
      default:
        return "text-base"; // 16px base
    }
  }, [fontSize]);

  return {
    fontSize,
    setFontSize,
    getFontSizeClass,
    isMounted,
  };
}
