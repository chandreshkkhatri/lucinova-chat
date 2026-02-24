export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt?: Date;
  parts?: any[];
  experimental_attachments?: any[];
  groundingMetadata?: {
    groundingChunks?: Array<{ web?: { uri?: string; title?: string } }>;
    groundingSupports?: Array<{
      segment?: { startIndex?: number; endIndex?: number; text?: string };
      groundingChunkIndices?: number[];
    }>;
    webSearchQueries?: string[];
    searchEntryPoint?: { renderedContent?: string };
  };
}

export const generateId = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
