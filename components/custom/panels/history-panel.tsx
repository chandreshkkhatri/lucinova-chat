"use client";

import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import cx from 'clsx';
import { ArrowLeft, FolderKanban, Pin, PinOff, Sparkles } from "lucide-react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { User } from "next-auth";
import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import useSWR from "swr";

import { IChat } from "@/db/models";
import { fetcher } from "@/lib/utils";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../ui/alert-dialog";
import { Button } from "../../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "../../ui/dropdown-menu";
import { Input } from "../../ui/input";
import {
  InfoIcon,
  MoreHorizontalIcon,
  PencilEditIcon,
  TrashIcon,
} from "../icons";
import { useSidebar } from "../sidebar-context";

type ChatListItem = IChat & { id: string };

export const HistoryPanel = ({
  user,
}: {
  user: User | undefined;
}) => {
  const { id } = useParams();
  const pathname = usePathname();
  const { selectedProjectId, setSelectedProjectId, togglePanel } = useSidebar();

  const {
    data: history,
    isLoading,
    mutate,
  } = useSWR<Array<ChatListItem>>(user ? "/api/history" : null, fetcher, {
    fallbackData: [],
  });

  // Fetch projects for grouping and the "Move to Project" submenu
  const { data: projects } = useSWR(
    user ? "/api/projects" : null,
    fetcher
  );

  useEffect(() => {
    mutate();
  }, [pathname, mutate]);

  // Filter chats by project if a project is selected
  const filteredHistory = selectedProjectId
    ? history?.filter((chat: any) => chat.projectId === selectedProjectId)
    : history;

  const selectedProject = selectedProjectId
    ? projects?.find((p: any) => p.id === selectedProjectId)
    : null;

  const handleMoveToProject = async (chatId: string, projectId: string | null) => {
    try {
      const res = await fetch("/api/chat", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: chatId, projectId }),
      });
      if (!res.ok) throw new Error("Failed to move chat");
      mutate();
    } catch (error) {
      console.error("Failed to move chat to project:", error);
    }
  };

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleEditClick = (chat: ChatListItem) => {
    setEditingChatId(chat.id);
    setEditingTitle(chat.title || "");
  };

  useEffect(() => {
    if (editingChatId && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingChatId]);

  const handleTitleUpdate = async () => {
    if (!editingChatId || !editingTitle) {
      setEditingChatId(null);
      return;
    }

    mutate(
      (history) =>
        history?.map((c) =>
          c.id === editingChatId
            ? { ...c, title: editingTitle }
            : c,
        ) as ChatListItem[],
      false,
    );

    const updatePromise = fetch(`/api/chat`, {
      method: "PUT",
      body: JSON.stringify({ id: editingChatId, title: editingTitle }),
      headers: { "Content-Type": "application/json" },
    });

    toast.promise(updatePromise, {
      loading: "Saving...",
      success: "Title saved.",
      error: "Error saving title.",
    });

    setEditingChatId(null);
  };

  const handleTogglePin = async (chat: ChatListItem) => {
    const chatId = chat.id;
    const newPinState = !chat.isPinned;
    mutate(
      (history) =>
        history?.map((c) =>
          c.id === chatId
            ? { ...c, isPinned: newPinState }
            : c,
        ).sort((a: any, b: any) => {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          return new Date(b.lastMsgAt).getTime() - new Date(a.lastMsgAt).getTime();
        }) as ChatListItem[],
      false,
    );
    await fetch(`/api/chat`, {
      method: "PUT",
      body: JSON.stringify({ id: chatId, isPinned: newPinState }),
      headers: { "Content-Type": "application/json" },
    });
  };

  const handleGenerateTitle = async (chat: ChatListItem) => {
    const chatId = chat.id;
    const generatePromise = fetch(`/api/chat/title`, {
      method: "POST",
      body: JSON.stringify({ chatId }),
      headers: { "Content-Type": "application/json" },
    }).then(async (res) => {
      if (!res.ok) throw new Error("Failed to generate title");
      const data = await res.json();
      mutate(
        (history) =>
          history?.map((c) =>
            c.id === chatId
              ? { ...c, title: data.title, category: data.category }
              : c,
          ) as ChatListItem[],
        false,
      );
      return data;
    });

    toast.promise(generatePromise, {
      loading: "Generating title...",
      success: "Title generated successfully.",
      error: "Failed to generate title.",
    });
  };

  const handleDelete = async () => {
    const deletePromise = fetch(`/api/chat?id=${deleteId}`, {
      method: "DELETE",
    });

    toast.promise(deletePromise, {
      loading: "Deleting chat...",
      success: () => {
        mutate((history) => {
          if (history) {
            return history.filter(
              (h) => h.id !== deleteId,
            );
          }
        });
        return "Chat deleted.";
      },
      error: "Failed to delete chat.",
    });

    setDeleteId(null);
    setShowDeleteDialog(false);
  };

  return (
    <>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-border">
          {selectedProject ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setSelectedProjectId(null);
                  togglePanel("projects");
                }}
                className="p-1 rounded hover:bg-accent text-muted-foreground"
              >
                <ArrowLeft className="size-4" />
              </button>
              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-foreground truncate">
                  {selectedProject.name}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {filteredHistory === undefined
                    ? "Loading..."
                    : `${filteredHistory.length} chats`}
                </p>
              </div>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-foreground">
                Chats
              </h2>
              <p className="text-sm text-muted-foreground">
                {history === undefined
                  ? "Loading chats..."
                  : `${history.length} conversations`}
              </p>
            </>
          )}
        </div>

        {/* New Chat Button */}
        {user && (
          <div className="p-4 border-b border-border">
            <Button
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              asChild
            >
              <Link href="/">
                <PencilEditIcon size={14} />
                <span className="ml-2">New Chat</span>
              </Link>
            </Button>
          </div>
        )}

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto p-2">
          {!user ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm text-center p-4">
              <InfoIcon size={32} />
              <p className="mt-2">Please log in to see your chat history.</p>
            </div>
          ) : null}

          {!isLoading && filteredHistory?.length === 0 && user ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm text-center p-4">
              <InfoIcon size={32} />
              <p className="mt-2">
                {selectedProjectId ? "No chats in this project." : "You have no saved chats."}
              </p>
            </div>
          ) : null}

          {isLoading && user ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="p-3 rounded-lg">
                  <div className="h-4 bg-muted rounded animate-pulse mb-2" />
                  <div className="h-3 bg-muted rounded animate-pulse w-3/4" />
                </div>
              ))}
            </div>
          ) : null}

          <div className="space-y-1">
            {filteredHistory &&
              filteredHistory.map((chat) => (
                <div
                  key={chat.id}
                  className={cx(
                    "group flex items-center justify-between p-3 rounded-lg hover:bg-card transition-colors",
                    {
                      "bg-card shadow-sm":
                        chat.id === id,
                    },
                  )}
                >
                  {editingChatId === chat.id ? (
                    <Input
                      ref={inputRef}
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onBlur={handleTitleUpdate}
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleTitleUpdate()
                      }
                      className="h-8 text-sm"
                    />
                  ) : (
                    <>
                      <Button
                        variant="ghost"
                        className="flex-1 justify-start p-0 h-auto font-normal text-left"
                        asChild
                      >
                        <Link
                          href={`/chat/${chat.id}`}
                          className="block truncate"
                          title={chat.title || "Untitled Chat"}
                        >
                          <div className="flex items-center gap-1.5">
                            {chat.isPinned && (
                              <Pin className="size-2.5 shrink-0 text-primary/70" />
                            )}
                            <div className="text-sm font-medium text-foreground truncate">
                              {chat.title || "Untitled Chat"}
                            </div>
                          </div>
                        </Link>
                      </Button>
                    </>
                  )}

                  <div className="flex items-center">
                    {(!chat.title || chat.title.toLowerCase() === "untitled chat" || chat.title.toLowerCase() === "new chat") && (
                      <Button
                        variant="ghost"
                        className="size-8 p-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground mr-1"
                        onClick={(e) => {
                          e.preventDefault();
                          handleGenerateTitle(chat);
                        }}
                        title="Generate Title"
                      >
                        <Sparkles size={14} />
                        <VisuallyHidden.Root>Generate Title</VisuallyHidden.Root>
                      </Button>
                    )}
                    <DropdownMenu modal={true}>
                      <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="size-8 p-0 opacity-0 group-hover:opacity-100"
                      >
                        <MoreHorizontalIcon size={16} />
                        <VisuallyHidden.Root>Dropdown Menu</VisuallyHidden.Root>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="right" className="z-[60]">
                      <DropdownMenuItem asChild>
                        <Button
                          className="flex items-center gap-2 w-full justify-start font-normal"
                          variant="ghost"
                          onClick={() => handleTogglePin(chat)}
                        >
                          {chat.isPinned ? <PinOff size={16} /> : <Pin size={16} />}
                          {chat.isPinned ? "Unpin" : "Pin"}
                        </Button>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Button
                          className="flex items-center gap-2 w-full justify-start font-normal"
                          variant="ghost"
                          onClick={() => handleEditClick(chat)}
                        >
                          <PencilEditIcon size={16} />
                          Edit
                        </Button>
                      </DropdownMenuItem>
                      {projects && projects.length > 0 && (
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger className="flex items-center gap-2">
                            <FolderKanban className="size-4" />
                            Move to Project
                          </DropdownMenuSubTrigger>
                          <DropdownMenuSubContent className="z-[60]">
                            <DropdownMenuItem
                              onClick={() => handleMoveToProject(chat.id, null)}
                            >
                              None (Ungrouped)
                            </DropdownMenuItem>
                            {projects.map((project: any) => (
                              <DropdownMenuItem
                                key={project.id}
                                onClick={() => handleMoveToProject(chat.id, project.id)}
                              >
                                {project.color && (
                                  <span
                                    className="inline-block size-2 rounded-full mr-2"
                                    style={{ backgroundColor: project.color }}
                                  />
                                )}
                                {project.name}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                      )}
                      <DropdownMenuItem asChild>
                        <Button
                          className="flex items-center gap-2 w-full justify-start font-normal"
                          variant="ghost"
                          onClick={() => {
                            setDeleteId(chat.id);
                            setShowDeleteDialog(true);
                          }}
                        >
                          <TrashIcon size={16} />
                          Delete
                        </Button>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Chat?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this chat. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
