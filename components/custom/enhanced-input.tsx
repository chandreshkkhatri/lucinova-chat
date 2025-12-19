"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
  Send, 
  Paperclip, 
  Mic, 
  Image, 
  FileText, 
  Smile,
  Hash,
  AtSign,
  Command,
  Zap
} from "lucide-react";
import { useState, useRef, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface EnhancedInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onAttachment?: (file: File) => void;
  isLoading?: boolean;
  placeholder?: string;
}

export function EnhancedInput({
  value,
  onChange,
  onSubmit,
  onAttachment,
  isLoading = false,
  placeholder = "Type a message...",
}: EnhancedInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !isLoading) {
        onSubmit();
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onAttachment) {
      onAttachment(file);
    }
  };

  const quickActions = [
    { icon: Hash, label: "Channel", action: () => onChange(value + "#") },
    { icon: AtSign, label: "Mention", action: () => onChange(value + "@") },
    { icon: Command, label: "Command", action: () => onChange(value + "/") },
    { icon: Zap, label: "Quick", action: () => setShowActions(!showActions) },
  ];

  const emojis = ["😊", "👍", "❤️", "🎉", "🤔", "😂", "🙏", "✨"];

  return (
    <div className="relative">
      {/* Quick actions bar */}
      <AnimatePresence>
        {showActions && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-full mb-2 inset-x-0 p-2 glass-card rounded-xl flex gap-2"
          >
            {quickActions.map((action) => (
              <button
                key={action.label}
                onClick={action.action}
                className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors flex items-center gap-2"
              >
                <action.icon className="size-4" />
                <span className="text-xs">{action.label}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Emoji picker */}
      <AnimatePresence>
        {showEmojis && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute bottom-full mb-2 right-0 p-2 glass-card rounded-xl flex gap-1"
          >
            {emojis.map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  onChange(value + emoji);
                  setShowEmojis(false);
                }}
                className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded transition-all hover:scale-125"
              >
                {emoji}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main input container */}
      <div
        className={`
          relative flex items-end gap-2 p-2 rounded-2xl transition-all duration-300
          ${isFocused 
            ? "glass-card ring-2 ring-blue-500/50 shadow-lg shadow-blue-500/10" 
            : "glass-card"
          }
        `}
      >
        {/* Attachment button */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/20"
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip className="size-4" />
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileSelect}
            accept="image/*,application/pdf,.txt,.doc,.docx"
          />
        </motion.div>

        {/* Textarea */}
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            className="
              min-h-[40px] max-h-[200px] resize-none border-0 focus:ring-0 
              bg-transparent placeholder:text-gray-400 pr-8
            "
            rows={1}
          />
          
          {/* Character count */}
          {value.length > 0 && (
            <div className="absolute bottom-1 right-1 text-xs text-gray-400">
              {value.length}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-1">
          {/* Emoji button */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="rounded-xl hover:bg-yellow-100 dark:hover:bg-yellow-900/20"
              onClick={() => setShowEmojis(!showEmojis)}
            >
              <Smile className="size-4" />
            </Button>
          </motion.div>

          {/* Quick actions */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="rounded-xl hover:bg-purple-100 dark:hover:bg-purple-900/20"
              onClick={() => setShowActions(!showActions)}
            >
              <Zap className="size-4" />
            </Button>
          </motion.div>

          {/* Send button */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              type="submit"
              size="icon"
              disabled={!value.trim() || isLoading}
              onClick={onSubmit}
              className={`
                rounded-xl transition-all duration-300
                ${value.trim() && !isLoading
                  ? "bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 shadow-lg"
                  : "bg-gray-300 dark:bg-gray-700"
                }
              `}
            >
              {isLoading ? (
                <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Typing hints */}
      <div className="mt-1 px-2 flex items-center gap-4 text-xs text-gray-400">
        <span>Press Enter to send</span>
        <span>Shift+Enter for new line</span>
        <span>@ to mention</span>
        <span>/ for commands</span>
      </div>

      <style jsx global>{`
        .glass-card {
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.3);
        }

        .dark .glass-card {
          background: rgba(24, 24, 27, 0.8);
          border: 1px solid rgba(63, 63, 70, 0.3);
        }
      `}</style>
    </div>
  );
}