"use client";

import { driver, DriveStep } from "driver.js";
import "driver.js/dist/driver.css";
import { createContext, useContext, useCallback, useEffect, useRef, useState } from "react";

import { useSidebar } from "./sidebar-context";

interface TourContextType {
  startTour: () => void;
  isTourActive: boolean;
}

const TourContext = createContext<TourContextType | undefined>(undefined);

export function TourProvider({ children }: { children: React.ReactNode }) {
  const driverObj = useRef<ReturnType<typeof driver> | null>(null);
  const { isPanelOpen, togglePanel } = useSidebar();
  const [isTourActive, setIsTourActive] = useState(false);
  // pendingDrive: set to true when we want to start the tour,
  // then useEffect waits for the re-render (demo data mounted) before calling drive()
  const [pendingDrive, setPendingDrive] = useState(false);

  const buildDriver = useCallback(() => {
    return driver({
      showProgress: true,
      animate: true,
      steps: [
        {
          popover: {
            title: "Welcome to Lucidity!",
            description: "Let's take a quick tour to help you get the most out of your experience.",
          },
        },
        {
          element: "#chat-input-area",
          popover: {
            title: "Chat Interface",
            description:
              "Type your messages here. You can also select models, attach files, and use voice input.",
            side: "top",
            align: "center",
          },
        },
        // Demo Chat Steps — annotation and reply
        {
          element: "#annotation-icon-demo-ann-1",
          popover: {
            title: "Contextual Annotations",
            description:
              "See that wire connection? Select any text in a message to start a focused discussion thread.",
            side: "left",
          },
        },
        {
          element: "#reply-btn-demo-msg-2",
          popover: {
            title: "Thread Replies",
            description:
              "Reply to specific messages to keep conversations organized without cluttering the main chat.",
            side: "top",
            align: "start",
          },
        },
        // Sidebar — shown after demo chat features
        {
          element: "#sidebar-projects",
          popover: {
            title: "Your Projects & History",
            description: "Access your chat history, manage projects, and organize your work here.",
            side: "right",
            align: "start",
          },
          onHighlightStarted: () => {
            if (!isPanelOpen) {
              togglePanel("projects");
            }
          },
        },
        {
          element: "#view-toggle",
          popover: {
            title: "Switch Views",
            description:
              "Toggle between the standard Chat view and the Canvas view for a more visual workspace.",
            side: "bottom",
            align: "center",
          },
        },
      ],
      onDestroyed: () => {
        localStorage.setItem("tour-completed", "true");
        setIsTourActive(false);
      },
    });
  }, [isPanelOpen, togglePanel]);

  // Build driver instance
  useEffect(() => {
    driverObj.current = buildDriver();
  }, [buildDriver]);

  const startTour = useCallback(() => {
    // First, set isTourActive so demo data renders
    setIsTourActive(true);
    // Then request a drive on the next render
    setPendingDrive(true);
  }, []);

  // When pendingDrive is set AND isTourActive is true,
  // the demo messages are in the DOM. Now we can safely call drive().
  useEffect(() => {
    if (pendingDrive && isTourActive) {
      // Rebuild driver to pick up latest closures after React state changed
      driverObj.current = buildDriver();
      // Small delay to let the annotation overlay (SavedAnnotationsOverlay)
      // compute positions via ResizeObserver before driver.js highlights
      const timer = setTimeout(() => {
        driverObj.current?.drive();
        setPendingDrive(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [pendingDrive, isTourActive, buildDriver]);

  // Auto-start check
  useEffect(() => {
    const isTourCompleted = localStorage.getItem("tour-completed");
    if (!isTourCompleted) {
      const timer = setTimeout(() => {
        startTour();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [startTour]);

  return (
    <TourContext.Provider value={{ startTour, isTourActive }}>
      {children}
    </TourContext.Provider>
  );
}

export function useTour() {
  const context = useContext(TourContext);
  if (context === undefined) {
    throw new Error("useTour must be used within a TourProvider");
  }
  return context;
}
