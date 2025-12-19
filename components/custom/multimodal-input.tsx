"use client";

import { Attachment, ChatRequestOptions, CreateMessage, Message } from "ai";
import { Plus, Wrench, Image as ImageIcon } from "lucide-react";
import React, {
  useRef,
  useEffect,
  useCallback,
  Dispatch,
  SetStateAction,
  ChangeEvent,
} from "react";
import { toast } from "sonner";

import { ArrowUpIcon, StopIcon } from "./icons";
import { PreviewAttachment } from "./preview-attachment";
import useWindowSize from "./use-window-size";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Textarea } from "../ui/textarea";

export function MultimodalInput({
  input,
  setInput,
  isLoading,
  stop,
  attachments,
  setAttachments,
  messages,
  append,
  handleSubmit,
}: {
  input: string;
  setInput: (value: string) => void;
  isLoading: boolean;
  stop: () => void;
  attachments: Array<Attachment>;
  setAttachments: Dispatch<SetStateAction<Array<Attachment>>>;
  messages: Array<Message>;
  append: (
    message: Message | CreateMessage,
    chatRequestOptions?: ChatRequestOptions
  ) => Promise<string | null | undefined>;
  handleSubmit: (
    event?: {
      preventDefault?: () => void;
    },
    chatRequestOptions?: ChatRequestOptions
  ) => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { width } = useWindowSize();

  useEffect(() => {
    if (textareaRef.current) {
      adjustHeight();
    }
  }, []);

  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${
        textareaRef.current.scrollHeight + 0
      }px`;
    }
  };

  const handleInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(event.target.value);
    adjustHeight();
  };

  const submitForm = useCallback(() => {
    handleSubmit(undefined, {
      experimental_attachments: attachments,
    });

    setAttachments([]);

    if (width && width > 768) {
      textareaRef.current?.focus();
    }
  }, [attachments, handleSubmit, setAttachments, width]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleFileChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);

      if (files.length === 0) return;

      files.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const base64 = e.target?.result as string;
          setAttachments((prev) => [
            ...prev,
            {
              name: file.name,
              contentType: file.type,
              url: base64,
            },
          ]);
        };
        reader.readAsDataURL(file);
      });
    },
    [setAttachments]
  );

  return (
    <div className="relative w-full flex flex-col gap-2">
      <input
        type="file"
        className="fixed -top-4 -left-4 size-0.5 opacity-0 pointer-events-none"
        ref={fileInputRef}
        multiple
        onChange={handleFileChange}
        tabIndex={-1}
      />

      {attachments.length > 0 && (
        <div className="flex flex-row gap-2 overflow-x-scroll">
          {attachments.map((attachment) => (
            <PreviewAttachment key={attachment.url} attachment={attachment} />
          ))}
        </div>
      )}

      <div className="flex flex-col rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm transition-all duration-200">
        <Textarea
          ref={textareaRef}
          placeholder="Type your message..."
          value={input}
          onChange={handleInput}
          className="min-h-[44px] sm:min-h-[48px] overflow-hidden resize-none text-sm sm:text-base bg-transparent border-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-4 py-3 pb-0"
          rows={1}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();

              if (isLoading) {
                toast.error("Please wait for the model to finish its response!");
              } else {
                submitForm();
              }
            }
          }}
        />

        <div className="flex justify-between items-center w-full px-2 pb-2 pt-1">
          <div className="flex items-center gap-1">
            <Button
              className="rounded-full size-8 p-0 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
              onClick={(event) => {
                event.preventDefault();
                fileInputRef.current?.click();
              }}
              variant="ghost"
              disabled={isLoading}
            >
              <Plus size={18} />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  className="rounded-full h-8 px-3 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 gap-1"
                  variant="ghost"
                  disabled={isLoading}
                >
                  <Wrench size={16} />
                  <span className="text-xs">Tools</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem
                  onClick={() => {
                    alert("Coming soon");
                  }}
                >
                  <ImageIcon className="mr-2 size-4" />
                  <span>Image Generation</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div>
            {isLoading ? (
              <Button
                className="rounded-full size-8 p-0 bg-red-500 hover:bg-red-600 text-white shadow-sm"
                onClick={(event) => {
                  event.preventDefault();
                  stop();
                }}
              >
                <StopIcon size={16} />
              </Button>
            ) : (
              <Button
                className="rounded-full size-8 p-0 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={(event) => {
                  event.preventDefault();
                  submitForm();
                }}
                disabled={input.length === 0 && attachments.length === 0}
              >
                <ArrowUpIcon size={16} />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
