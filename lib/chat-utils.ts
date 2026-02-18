export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt?: Date;
  parts?: any[];
  experimental_attachments?: any[];
}

export const generateId = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
