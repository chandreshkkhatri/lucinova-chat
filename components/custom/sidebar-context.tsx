"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";

export type SidebarPanelId = "history" | "search" | "settings";

interface SidebarContextValue {
  activePanel: SidebarPanelId | null;
  isPanelOpen: boolean;
  togglePanel: (panelId: SidebarPanelId) => void;
  closePanel: () => void;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [activePanel, setActivePanel] = useState<SidebarPanelId | null>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("sidebar-active-panel");
      if (stored === "history" || stored === "search" || stored === "settings") {
        return stored;
      }
    }
    return "history";
  });

  const isPanelOpen = activePanel !== null;

  const togglePanel = useCallback((panelId: SidebarPanelId) => {
    setActivePanel((current) => (current === panelId ? null : panelId));
  }, []);

  const closePanel = useCallback(() => {
    setActivePanel(null);
  }, []);

  useEffect(() => {
    if (activePanel !== null) {
      localStorage.setItem("sidebar-active-panel", activePanel);
    } else {
      localStorage.removeItem("sidebar-active-panel");
    }
  }, [activePanel]);

  return (
    <SidebarContext.Provider value={{ activePanel, isPanelOpen, togglePanel, closePanel }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar must be used within SidebarProvider");
  return ctx;
}
