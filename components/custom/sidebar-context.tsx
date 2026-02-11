"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";

export type SidebarPanelId = "history" | "search" | "settings" | "projects";

interface SidebarContextValue {
  activePanel: SidebarPanelId | null;
  isPanelOpen: boolean;
  togglePanel: (panelId: SidebarPanelId) => void;
  closePanel: () => void;
  selectedProjectId: string | null;
  setSelectedProjectId: (projectId: string | null) => void;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [activePanel, setActivePanel] = useState<SidebarPanelId | null>("history");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Sync from localStorage after hydration to avoid SSR mismatch
  useEffect(() => {
    const stored = localStorage.getItem("sidebar-active-panel");
    if (stored === "history" || stored === "search" || stored === "settings" || stored === "projects") {
      setActivePanel(stored);
    } else if (stored === "closed") {
      setActivePanel(null);
    }
  }, []);

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
      localStorage.setItem("sidebar-active-panel", "closed");
    }
  }, [activePanel]);

  return (
    <SidebarContext.Provider value={{ activePanel, isPanelOpen, togglePanel, closePanel, selectedProjectId, setSelectedProjectId }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar must be used within SidebarProvider");
  return ctx;
}
