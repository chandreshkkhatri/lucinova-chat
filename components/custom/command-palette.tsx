"use client";

import { Command } from "cmdk";
import {
  FileText,
  FolderKanban,
  MessageSquare,
  Plus,
  Search,
  Settings,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import useSWR from "swr";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";

import { useSidebar } from "./sidebar-context";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { togglePanel } = useSidebar();

  // Fetch chat history for search
  const { data: history, mutate: mutateHistory } = useSWR(
    open ? "/api/history" : null,
    fetcher
  );

  // Revalidate history when dialog opens
  useEffect(() => {
    if (open) mutateHistory();
  }, [open, mutateHistory]);

  // Keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = useCallback(
    (command: () => void) => {
      setOpen(false);
      command();
    },
    []
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="overflow-hidden p-0 max-w-lg">
        <VisuallyHidden.Root>
          <DialogTitle>Command Palette</DialogTitle>
        </VisuallyHidden.Root>
        <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3">
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Command.Input
              placeholder="Search chats, actions, navigation..."
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <Command.List className="max-h-[300px] overflow-y-auto overflow-x-hidden p-2">
            <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
              No results found.
            </Command.Empty>

            {/* Chats */}
            {history && history.length > 0 && (
              <Command.Group heading="Chats">
                {history.slice(0, 8).map((chat: any) => (
                  <Command.Item
                    key={chat.id}
                    value={chat.title || "Untitled"}
                    onSelect={() =>
                      runCommand(() => router.push(`/chat/${chat.id}`))
                    }
                    className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer aria-selected:bg-accent aria-selected:text-accent-foreground"
                  >
                    <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="truncate">{chat.title || "Untitled"}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {/* Actions */}
            <Command.Group heading="Actions">
              <Command.Item
                onSelect={() => runCommand(() => router.push("/"))}
                className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer aria-selected:bg-accent aria-selected:text-accent-foreground"
              >
                <Plus className="h-4 w-4 text-muted-foreground" />
                <span>New Chat</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => togglePanel("history"))}
                className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer aria-selected:bg-accent aria-selected:text-accent-foreground"
              >
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span>Toggle History Panel</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => togglePanel("projects"))}
                className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer aria-selected:bg-accent aria-selected:text-accent-foreground"
              >
                <FolderKanban className="h-4 w-4 text-muted-foreground" />
                <span>Toggle Projects Panel</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => togglePanel("search"))}
                className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer aria-selected:bg-accent aria-selected:text-accent-foreground"
              >
                <Search className="h-4 w-4 text-muted-foreground" />
                <span>Toggle Search Panel</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => togglePanel("settings"))}
                className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer aria-selected:bg-accent aria-selected:text-accent-foreground"
              >
                <Settings className="h-4 w-4 text-muted-foreground" />
                <span>Toggle Settings Panel</span>
              </Command.Item>
            </Command.Group>

            {/* Navigation */}
            <Command.Group heading="Navigation">
              <Command.Item
                onSelect={() => runCommand(() => router.push("/account"))}
                className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer aria-selected:bg-accent aria-selected:text-accent-foreground"
              >
                <User className="h-4 w-4 text-muted-foreground" />
                <span>Account</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push("/pricing"))}
                className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer aria-selected:bg-accent aria-selected:text-accent-foreground"
              >
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span>Pricing</span>
              </Command.Item>
            </Command.Group>
          </Command.List>

          <div className="border-t px-3 py-2">
            <p className="text-xs text-muted-foreground text-center">
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                <span className="text-xs">⌘</span>K
              </kbd>
              {" "}to toggle
            </p>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
