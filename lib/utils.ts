import { generateId } from "@/lib/chat-utils";
import { clsx, type ClassValue } from "clsx";
import mongoose from "mongoose";
import { twMerge } from "tailwind-merge";

import { IChat, IMessage } from "@/db/models";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ApplicationError extends Error {
  info: string;
  status: number;
}

export const fetcher = async (url: string) => {
  const res = await fetch(url);

  if (!res.ok) {
    const error = new Error(
      "An error occurred while fetching the data."
    ) as ApplicationError;

    error.info = await res.json();
    error.status = res.status;

    throw error;
  }

  return res.json();
};

export function getLocalStorage(key: string) {
  if (typeof window !== "undefined") {
    return JSON.parse(localStorage.getItem(key) || "[]");
  }
  return [];
}

export function generateUUID(): string {
  return new mongoose.Types.ObjectId().toString();
}

// Note: addToolMessageToChat and convertToUIMessages removed during SDK v6 migration
// SDK v6 handles message conversion internally via useChat

export function getTitleFromChat(chat: IChat & { messages: IMessage[] }) {
  const firstMessage = chat.messages?.[0];

  if (!firstMessage) {
    return "Untitled";
  }

  return firstMessage.body;
}
