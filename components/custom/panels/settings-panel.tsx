"use client";

import { ThemeToggle } from "../theme-toggle";

export const SettingsPanel = () => {
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
      </div>
    </div>
  );
};
