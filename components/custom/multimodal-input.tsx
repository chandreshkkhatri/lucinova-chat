"use client";

import { UIMessage } from "ai";
import { FileText, Mic, MicOff, Plus, Send, Square, X } from "lucide-react";
import Image from "next/image";
import { useRef, useState, useEffect, useCallback, Dispatch, SetStateAction } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import { Attachment } from "./types";

interface MultimodalInputProps {
  input: string;
  setInput: (value: string) => void;
  isLoading: boolean;
  stop: () => void;
  attachments: Attachment[];
  setAttachments: Dispatch<SetStateAction<Attachment[]>>;
  messages: UIMessage[];
  sendMessage: (message: {
    text: string;
    attachments?: Attachment[];
    options?: { body?: any }
  }) => Promise<void>;
  handleSubmit: (e?: React.FormEvent) => void;
}

// Maximum recording duration in milliseconds (60 seconds)
const MAX_RECORDING_DURATION = 60000;

export function MultimodalInput({
  input,
  setInput,
  isLoading,
  stop,
  attachments,
  setAttachments,
  messages,
  sendMessage,
  handleSubmit,
}: MultimodalInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Audio recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [micSupported, setMicSupported] = useState(true);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check for MediaRecorder support on mount
  useEffect(() => {
    const supported =
      typeof window !== "undefined" &&
      "MediaRecorder" in window &&
      "mediaDevices" in navigator &&
      "getUserMedia" in navigator.mediaDevices;
    setMicSupported(supported);
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        200
      )}px`;
    }
  }, [input]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearTimeout(recordingTimerRef.current);
      if (durationIntervalRef.current)
        clearInterval(durationIntervalRef.current);
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state === "recording"
      ) {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isLoading) {
        handleSubmit();
      }
    }
  };

  // Handle file selection with better error handling and async reading
  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    const newAttachments: Attachment[] = [];

    try {
      const readPromises = fileList.map(file => {
        return new Promise<Attachment>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            resolve({
              name: file.name,
              contentType: file.type,
              url: reader.result as string,
            });
          };
          reader.onerror = () => {
            console.error(`[FileRead] Error reading file ${file.name}:`, reader.error);
            reject(reader.error);
          };
          reader.readAsDataURL(file);
        });
      });

      const results = await Promise.all(readPromises);
      setAttachments(prev => [...prev, ...results]);
    } catch (error) {
      console.error("[FileRead] Failed to process one or more files:", error);
      alert("Failed to attach one or more files. Please try again.");
    } finally {
      // Clear input value to allow selecting the same file again
      e.target.value = "";
    }
  }, [setAttachments]);

  // Handle paste events for images
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const imageItems = Array.from(items).filter(item => item.type.startsWith("image/"));
      if (imageItems.length === 0) return;

      const newFiles = imageItems
        .map(item => item.getAsFile())
        .filter((file): file is File => file !== null);

      if (newFiles.length === 0) return;

      try {
        const readPromises = newFiles.map(file => {
          return new Promise<Attachment>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              resolve({
                name: file.name || `pasted-image-${Date.now()}.png`,
                contentType: file.type,
                url: reader.result as string,
              });
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
        });

        const results = await Promise.all(readPromises);
        setAttachments(prev => [...prev, ...results]);
      } catch (error) {
        console.error("[Paste] Failed to process pasted images:", error);
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [setAttachments]);

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  // Start audio recording
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Try WebM first (best support), fallback to other formats
      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/mp4")
          ? "audio/mp4"
          : "audio/ogg";

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Stop all tracks to release the microphone
        stream.getTracks().forEach((track) => track.stop());

        // Clear timers
        if (recordingTimerRef.current) clearTimeout(recordingTimerRef.current);
        if (durationIntervalRef.current)
          clearInterval(durationIntervalRef.current);

        // Create audio blob
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });

        // Convert to base64
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Audio = reader.result as string;

          // Create attachment and submit
          const audioAttachment: Attachment = {
            name: `voice-message-${Date.now()}.webm`,
            contentType: mimeType,
            url: base64Audio,
          };

          // Append message with audio attachment
          sendMessage({
            text: "[Voice message]",
            attachments: [audioAttachment],
          });
        };
        reader.readAsDataURL(audioBlob);

        setIsRecording(false);
        setRecordingDuration(0);
      };

      // Start recording
      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
      setRecordingDuration(0);

      // Update duration display
      durationIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);

      // Auto-stop after max duration
      recordingTimerRef.current = setTimeout(() => {
        if (
          mediaRecorderRef.current &&
          mediaRecorderRef.current.state === "recording"
        ) {
          mediaRecorderRef.current.stop();
        }
      }, MAX_RECORDING_DURATION);
    } catch (error) {
      console.error("Failed to start recording:", error);
      // Handle permission denied or other errors
      if (error instanceof DOMException && error.name === "NotAllowedError") {
        alert(
          "Microphone permission denied. Please allow microphone access to use voice input."
        );
      } else {
        alert("Failed to start recording. Please try again.");
      }
    }
  }, [sendMessage]);

  // Stop audio recording
  const stopRecording = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.stop();
    }
  }, []);

  // Format duration as MM:SS
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const hasInput = (input?.trim().length ?? 0) > 0 || attachments.length > 0;
  const showMicButton = !hasInput && !isLoading && micSupported && !isRecording;
  const showStopRecordingButton = isRecording;
  const showSendButton = hasInput && !isLoading && !isRecording;
  const showStopGenerating = isLoading && !isRecording;

  return (
    <div className="relative">
      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2 p-2 bg-muted rounded-lg">
          {attachments.map((attachment, index) => (
            <div
              key={index}
              className="relative group flex items-center gap-2 px-3 py-2 bg-card rounded-lg border border-border"
            >
              {attachment.contentType?.startsWith("image/") ? (
                <Image
                  src={attachment.url}
                  alt={attachment.name || "Attachment"}
                  width={40}
                  height={40}
                  unoptimized
                  className="size-10 object-cover rounded"
                />
              ) : (
                <FileText className="size-4 text-muted-foreground" />
              )}
              <span className="text-sm text-foreground/80 max-w-[100px] truncate">
                {attachment.name}
              </span>
              <button
                onClick={() => removeAttachment(index)}
                className="p-1 hover:bg-muted rounded-full"
              >
                <X className="size-3 text-muted-foreground" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Recording Indicator */}
      {isRecording && (
        <div className="flex items-center gap-3 mb-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="relative">
            <div className="size-3 bg-red-500 rounded-full animate-pulse" />
            <div className="absolute inset-0 size-3 bg-red-500 rounded-full animate-ping opacity-75" />
          </div>
          <span className="text-sm font-medium text-red-700 dark:text-red-300">
            Recording... {formatDuration(recordingDuration)}
          </span>
          <span className="text-xs text-red-500 dark:text-red-400">
            (max {MAX_RECORDING_DURATION / 1000}s)
          </span>
        </div>
      )}

      {/* Main Input Container */}
      <div className="flex items-end gap-2 p-2 bg-card border border-border rounded-2xl shadow-sm">
        {/* Attachment Button */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0 size-10 rounded-xl hover:bg-muted"
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading || isRecording}
        >
          <Plus className="size-5 text-muted-foreground" />
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          className="invisible absolute size-0 opacity-0 pointer-events-none"
          multiple
          accept="image/*,application/pdf,.txt,.doc,.docx"
          onChange={handleFileSelect}
        />

        {/* Textarea */}
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isRecording ? "Recording audio..." : "Type a message..."}
          disabled={isLoading || isRecording}
          className="flex-1 min-h-[40px] max-h-[200px] resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground"
          rows={1}
        />

        {/* Action Buttons */}
        <div className="shrink-0">
          {/* Mic Button - shown when no input and not loading */}
          {showMicButton && (
            <Button
              type="button"
              size="icon"
              className="size-10 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
              onClick={startRecording}
            >
              <Mic className="size-5" />
            </Button>
          )}

          {/* Stop Recording Button */}
          {showStopRecordingButton && (
            <Button
              type="button"
              size="icon"
              className="size-10 rounded-xl bg-red-500 hover:bg-red-600 text-white shadow-lg"
              onClick={stopRecording}
            >
              <Square className="size-4 fill-current" />
            </Button>
          )}

          {/* Send Button - shown when there's input */}
          {showSendButton && (
            <Button
              type="submit"
              size="icon"
              className="size-10 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
              onClick={(e) => {
                e.preventDefault();
                handleSubmit();
              }}
            >
              <Send className="size-5" />
            </Button>
          )}

          {/* Stop Generating Button - shown when loading */}
          {showStopGenerating && (
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="size-10 rounded-xl"
              onClick={stop}
            >
              <Square className="size-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Typing hints */}
      <div className="mt-1.5 px-2 flex items-center gap-4 text-xs text-muted-foreground">
        <span>Press Enter to send</span>
        <span>Shift+Enter for new line</span>
        {micSupported && <span>Click mic to record</span>}
      </div>
    </div>
  );
}
