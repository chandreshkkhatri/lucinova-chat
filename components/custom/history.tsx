"use client";

import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import cx from 'clsx';
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { User } from "next-auth";
import { useEffect, useState, useRef } from "react";

import { toast } from "sonner";
import useSWR from "swr";

import { IChat } from "@/db/models";
import { fetcher } from "@/lib/utils";

import {
  InfoIcon,
  MoreHorizontalIcon,
  PencilEditIcon,
  TrashIcon,
} from "./icons";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Input } from "../ui/input";

export const History = ({
  user,
  inSheet = false,
}: {
  user: User | undefined;
  inSheet?: boolean;
}) => {
  const { id } = useParams();
  const pathname = usePathname();

  const {
    data: history,
    isLoading,
    mutate,
  } = useSWR<Array<IChat>>(user ? "/api/history" : null, fetcher, {
    fallbackData: [],
  });

  useEffect(() => {
    mutate();
  }, [pathname, mutate]);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleEditClick = (chat: IChat) => {
    setEditingChatId((chat as any)._id.toString());
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
          (c as any)._id.toString() === editingChatId
            ? { ...c, title: editingTitle }
            : c,
        ) as IChat[],
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
              (h) => (h as any)._id.toString() !== deleteId,
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

  // If in sheet (mobile), always show the sidebar
  // If not in sheet (desktop), only show when screen is large
  const containerClasses = inSheet
    ? "flex w-full bg-secondary h-full flex-col"
    : "hidden lg:flex w-64 bg-secondary h-full border-r border-border flex-col";

  return (
    <>
      {/* Single sidebar component that works for both mobile and desktop */}
      <div className={containerClasses}>
        {/* Header */}
        <div className="p-4 border-b border-border">
          <h1 className="text-lg font-semibold text-foreground">Chats</h1>
          <p className="text-sm text-muted-foreground">
            {history === undefined
              ? "Loading chats..."
              : `${history.length} conversations`}
          </p>
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

          {!isLoading && history?.length === 0 && user ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm text-center p-4">
              <InfoIcon size={32} />
              <p className="mt-2">You have no saved chats.</p>
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
            {history &&
              history.map((chat) => (
                <div
                  key={(chat as any)._id.toString()}
                  className={cx(
                    "group flex items-center justify-between p-3 rounded-lg hover:bg-card transition-colors",
                    {
                      "bg-card shadow-sm": (chat as any)._id.toString() === id,
                    },
                  )}
                >
                  {editingChatId === (chat as any)._id.toString() ? (
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
                          href={`/chat/${(chat as any)._id.toString()}`}
                          className="block truncate"
                          title={chat.title || "Untitled Chat"}
                        >
                          <div className="text-sm font-medium text-foreground truncate">
                            {chat.title || "Untitled Chat"}
                          </div>
                        </Link>
                      </Button>
                    </>
                  )}

                  <DropdownMenu modal={true}>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100"
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
                          onClick={() => handleEditClick(chat)}
                        >
                          <PencilEditIcon size={16} />
                          Edit
                        </Button>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Button
                          className="flex items-center gap-2 w-full justify-start font-normal"
                          variant="ghost"
                          onClick={() => {
                            setDeleteId((chat as any)._id.toString());
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
              ))}
          </div>
        </div>

        {/* Community Section */}
        <div className="p-4 border-t border-border">
          <a
            href="https://discord.gg/ySGBwu9xvk"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-card rounded-lg transition-colors"
          >
            <svg
              className="size-4"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
            </svg>
            Join Community
          </a>
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
