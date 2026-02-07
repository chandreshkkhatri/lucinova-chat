"use client";

import { User } from "next-auth";
import { motion, AnimatePresence } from "framer-motion";

import { useSidebar } from "./sidebar-context";
import { HistoryPanel } from "./panels/history-panel";
import { SearchPanel } from "./panels/search-panel";
import { SettingsPanel } from "./panels/settings-panel";

export function SidebarPanel({ user }: { user: User | undefined }) {
  const { activePanel, isPanelOpen } = useSidebar();

  return (
    <AnimatePresence initial={false}>
      {isPanelOpen && (
        <motion.div
          key="sidebar-panel"
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 256, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="hidden lg:block h-full overflow-hidden border-r border-border bg-secondary shrink-0"
        >
          <div className="w-64 h-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={activePanel}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="h-full"
              >
                {activePanel === "history" && <HistoryPanel user={user} />}
                {activePanel === "search" && <SearchPanel user={user} />}
                {activePanel === "settings" && <SettingsPanel />}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
