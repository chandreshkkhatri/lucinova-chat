"use client";

import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import cx from 'clsx';
import { FolderKanban, Plus, MoreHorizontal, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";

import { fetcher } from "@/lib/utils";

import { PencilEditIcon } from "../icons";
import { useSidebar } from "../sidebar-context";
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
  DropdownMenuTrigger,
} from "../../ui/dropdown-menu";
import { Input } from "../../ui/input";

const PROJECT_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#6b7280", // gray
];

export function ProjectsPanel() {
  const { selectedProjectId, setSelectedProjectId, togglePanel } = useSidebar();

  const {
    data: projects,
    isLoading,
    mutate,
  } = useSWR("/api/projects", fetcher, { fallbackData: [] });

  // Fetch chat counts per project
  const { data: history } = useSWR("/api/history", fetcher);

  const chatCountsByProject: Record<string, number> = {};
  if (history) {
    for (const chat of history) {
      const pid = (chat as any).projectId;
      if (pid) {
        chatCountsByProject[pid] = (chatCountsByProject[pid] || 0) + 1;
      }
    }
  }

  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const createInputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isCreating && createInputRef.current) {
      createInputRef.current.focus();
    }
  }, [isCreating]);

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingId]);

  const handleCreate = async () => {
    if (!newName.trim()) {
      setIsCreating(false);
      return;
    }

    const randomColor = PROJECT_COLORS[Math.floor(Math.random() * PROJECT_COLORS.length)];

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), color: randomColor }),
      });
      if (!res.ok) throw new Error("Failed to create project");
      mutate();
      toast.success("Project created");
    } catch {
      toast.error("Failed to create project");
    }

    setNewName("");
    setIsCreating(false);
  };

  const handleRename = async () => {
    if (!editingId || !editingName.trim()) {
      setEditingId(null);
      return;
    }

    try {
      const res = await fetch(`/api/projects/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editingName.trim() }),
      });
      if (!res.ok) throw new Error("Failed to rename project");
      mutate();
      toast.success("Project renamed");
    } catch {
      toast.error("Failed to rename project");
    }

    setEditingId(null);
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const res = await fetch(`/api/projects/${deleteId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete project");
      mutate();
      if (selectedProjectId === deleteId) {
        setSelectedProjectId(null);
      }
      toast.success("Project deleted");
    } catch {
      toast.error("Failed to delete project");
    }

    setDeleteId(null);
    setShowDeleteDialog(false);
  };

  const handleSelectProject = (projectId: string) => {
    setSelectedProjectId(projectId);
    // Switch to history panel to show filtered chats
    togglePanel("history");
  };

  return (
    <>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Projects</h2>
          <p className="text-sm text-muted-foreground">
            {projects === undefined
              ? "Loading..."
              : `${projects.length} project${projects.length !== 1 ? "s" : ""}`}
          </p>
        </div>

        {/* New Project Button */}
        <div className="p-4 border-b border-border">
          {isCreating ? (
            <Input
              ref={createInputRef}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onBlur={handleCreate}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate();
                if (e.key === "Escape") {
                  setIsCreating(false);
                  setNewName("");
                }
              }}
              placeholder="Project name..."
              className="h-9 text-sm"
            />
          ) : (
            <Button
              className="w-full"
              variant="outline"
              onClick={() => setIsCreating(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          )}
        </div>

        {/* Project List */}
        <div className="flex-1 overflow-y-auto p-2">
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((item) => (
                <div key={item} className="p-3 rounded-lg">
                  <div className="h-4 bg-muted rounded animate-pulse mb-2" />
                  <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
                </div>
              ))}
            </div>
          ) : projects?.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-sm text-center p-4">
              <FolderKanban className="h-8 w-8 mb-2 opacity-50" />
              <p>No projects yet.</p>
              <p className="text-xs mt-1">Create one to organize your chats.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {/* All Chats option */}
              <button
                onClick={() => {
                  setSelectedProjectId(null);
                  togglePanel("history");
                }}
                className={cx(
                  "flex items-center gap-2 w-full p-3 rounded-lg text-sm transition-colors text-left",
                  !selectedProjectId
                    ? "bg-card shadow-sm text-foreground"
                    : "text-muted-foreground hover:bg-card"
                )}
              >
                <FolderKanban className="h-4 w-4 shrink-0" />
                <span className="truncate font-medium">All Chats</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {history?.length || 0}
                </span>
              </button>

              {/* Project items */}
              {projects?.map((project: any) => (
                <div
                  key={project.id}
                  className={cx(
                    "group flex items-center justify-between p-3 rounded-lg transition-colors",
                    selectedProjectId === project.id
                      ? "bg-card shadow-sm"
                      : "hover:bg-card"
                  )}
                >
                  {editingId === project.id ? (
                    <Input
                      ref={editInputRef}
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onBlur={handleRename}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleRename();
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      className="h-8 text-sm"
                    />
                  ) : (
                    <button
                      onClick={() => handleSelectProject(project.id)}
                      className="flex items-center gap-2 flex-1 min-w-0 text-left"
                    >
                      {project.color ? (
                        <span
                          className="inline-block w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: project.color }}
                        />
                      ) : (
                        <FolderKanban className="h-4 w-4 shrink-0 text-muted-foreground" />
                      )}
                      <span className="text-sm font-medium text-foreground truncate">
                        {project.name}
                      </span>
                      <span className="ml-auto text-xs text-muted-foreground shrink-0">
                        {chatCountsByProject[project.id] || 0}
                      </span>
                    </button>
                  )}

                  <DropdownMenu modal={true}>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 shrink-0 ml-1"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                        <VisuallyHidden.Root>Project menu</VisuallyHidden.Root>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="right" className="z-[60]">
                      <DropdownMenuItem
                        onClick={() => {
                          setEditingId(project.id);
                          setEditingName(project.name);
                        }}
                        className="flex items-center gap-2"
                      >
                        <PencilEditIcon size={16} />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setDeleteId(project.id);
                          setShowDeleteDialog(true);
                        }}
                        className="flex items-center gap-2 text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the project. Chats in this project will be moved to
              &quot;Ungrouped&quot; and will not be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Delete Project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
