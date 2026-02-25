"use client";

import { useFontSize, FontSize } from "@/hooks/use-font-size";

import { ThemeToggle } from "../theme-toggle";

export const SettingsPanel = () => {
  const { fontSize, setFontSize, isMounted } = useFontSize();
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground">Settings</h2>
        <p className="text-sm text-muted-foreground">Preferences</p>
      </div>

      {/* Settings Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div>
          <label className="text-sm font-medium text-foreground">Theme</label>
          <div className="mt-2">
            <ThemeToggle inDropdown={true} />
          </div>
        </div>

        <div className="pt-4 border-t border-border">
          <label className="text-sm font-medium text-foreground">Chat Font Size</label>
          <div className="mt-2 flex gap-2">
            {(["small", "medium", "large"] as FontSize[]).map((size) => (
              <button
                key={size}
                onClick={() => setFontSize(size)}
                className={`flex-1 py-1.5 px-3 rounded-md text-sm capitalize font-medium transition-colors border ${
                  isMounted && fontSize === size
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border hover:bg-muted hover:text-foreground"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
