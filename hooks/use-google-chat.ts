import { useState, useRef, useCallback } from "react";

import { Message, generateId } from "@/lib/chat-utils";

export type { Message };


interface UseGoogleChatOptions {
  id?: string;
  initialMessages?: Message[];
  api?: string;
  onFinish?: (message: Message) => void;
  onError?: (error: Error) => void;
  body?: any;
}

export function useGoogleChat({
  id,
  initialMessages = [],
  api = "/api/chat",
  onFinish,
  onError,
  body,
}: UseGoogleChatOptions = {}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "streaming" | "submitted" | "error">("idle");
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const isSubmittingRef = useRef(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setInput(e.target.value);
  };

  const stop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
      setStatus("idle");
      isSubmittingRef.current = false;
    }
  }, []);

  const append = useCallback(
    async (
      messageInput: {
        text?: string;
        content?: string;
        files?: any[];
        role?: "user";
      } | Message,
      options?: { body?: any }
    ) => {
      // Synchronous guard — prevents duplicate submissions from rapid Enter
      if (isSubmittingRef.current) return;
      isSubmittingRef.current = true;

      // Determine content and files based on input shape
      const isMessageObject = "id" in messageInput && "role" in messageInput;
      
      const content = isMessageObject 
        ? (messageInput as Message).content 
        : (messageInput as any).text || (messageInput as any).content || "";
        
      const files = isMessageObject 
        ? (messageInput as Message).experimental_attachments 
        : (messageInput as any).files || [];

      const userMessage: Message = {
        id: generateId(),
        role: "user",
        content,
        createdAt: new Date(),
        experimental_attachments: files.map((f: any) => ({
           contentType: f.mediaType || f.contentType,
           url: f.url,
           name: f.filename || f.name
        })),
        parts: [{ type: "text", text: content }]
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      setStatus("submitted");

      abortControllerRef.current = new AbortController();

      // Keep context window bounded: send only the last N messages
      const MAX_CONTEXT_MESSAGES = 20;

      try {
        const allMessages = [...messages, userMessage];
        const contextMessages = allMessages.slice(-MAX_CONTEXT_MESSAGES);

        const response = await fetch(api, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: contextMessages,
            ...(options?.body || body || {}),
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
           // Try to read error text
           const errorText = await response.text();
           throw new Error(errorText || `Chat request failed: ${response.statusText}`);
        }
        
        if (!response.body) throw new Error("No response body");

        setStatus("streaming");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        
        let assistantMessage: Message = {
           id: generateId(), // Will be updated by server sync later if needed, but we generate one for now
           role: 'assistant',
           content: '',
           createdAt: new Date(),
           parts: [],
        };
        
        setMessages((prev) => [...prev, assistantMessage]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          
          // Server returns raw text stream for now
          assistantMessage = {
             ...assistantMessage,
             content: assistantMessage.content + chunk
          };
          
          setMessages((prev) => {
             const newMessages = [...prev];
             // Update the last message (which is the assistant message we added)
             newMessages[newMessages.length - 1] = { ...assistantMessage };
             return newMessages;
          });
        }
        
        setIsLoading(false);
        setStatus("idle");
        onFinish?.(assistantMessage);

      } catch (err: any) {
        if (err.name === 'AbortError') return;
        console.error(err);
        setIsLoading(false);
        setStatus("error");
        onError?.(err);
      } finally {
        isSubmittingRef.current = false;
      }
    },
    [api, messages, body, onFinish, onError]
  );
  
  // Alias sendMessage to append and ensure it returns promise
  const sendMessage = append;
  
  const reload = useCallback(async () => {
     // TODO: Implement reload if needed
  }, []);

  return {
    messages,
    input,
    handleInputChange,
    handleSubmit: (e?: any) => Promise.resolve(), 
    isLoading,
    stop,
    setMessages,
    append,
    sendMessage,
    status,
    reload,
    regenerate: reload // typical alias
  };
}
