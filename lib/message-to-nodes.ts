import type { UIMessage } from "ai";

export type NodeType = "text" | "mermaid" | "code";

export interface CanvasNode {
  id: string;
  type: NodeType;
  content: string;
  language?: string;
  role: "user" | "assistant";
  messageId: string;
}

/**
 * Extract text content from a UIMessage, handling parts and fallback formats.
 */
function extractMessageContent(message: UIMessage): string {
  if ((message as any).parts) {
    const text = (message as any).parts
      .filter((p: any) => p.type === "text")
      .map((p: any) => p.text)
      .join("");
    if (text) return text;
  }

  const rawContent = (message as any).content;
  if (typeof rawContent === "string") {
    return rawContent.startsWith("[object Object]") ? "" : rawContent;
  }
  return rawContent == null ? "" : JSON.stringify(rawContent);
}

/**
 * Parse content into nodes by detecting fenced code blocks.
 * A single message can produce multiple nodes:
 * - Text surrounding code blocks → text nodes
 * - ```mermaid ... ``` → mermaid node
 * - ```language ... ``` → code node
 */
function parseContentToNodes(
  content: string,
  messageId: string,
  role: "user" | "assistant",
): CanvasNode[] {
  const nodes: CanvasNode[] = [];
  // Match fenced code blocks: ```language\n...\n```
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let nodeIndex = 0;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    // Text before this code block
    const textBefore = content.slice(lastIndex, match.index).trim();
    if (textBefore) {
      nodes.push({
        id: `${messageId}-${nodeIndex++}`,
        type: "text",
        content: textBefore,
        role,
        messageId,
      });
    }

    const language = match[1] || "";
    const codeContent = match[2];

    if (language.toLowerCase() === "mermaid") {
      nodes.push({
        id: `${messageId}-${nodeIndex++}`,
        type: "mermaid",
        content: codeContent.trim(),
        role,
        messageId,
      });
    } else {
      nodes.push({
        id: `${messageId}-${nodeIndex++}`,
        type: "code",
        content: codeContent,
        language: language || undefined,
        role,
        messageId,
      });
    }

    lastIndex = match.index + match[0].length;
  }

  // Remaining text after the last code block
  const textAfter = content.slice(lastIndex).trim();
  if (textAfter) {
    nodes.push({
      id: `${messageId}-${nodeIndex++}`,
      type: "text",
      content: textAfter,
      role,
      messageId,
    });
  }

  // If no code blocks were found, the entire content is a single text node
  if (nodes.length === 0 && content.trim()) {
    nodes.push({
      id: `${messageId}-0`,
      type: "text",
      content: content.trim(),
      role,
      messageId,
    });
  }

  return nodes;
}

/**
 * Convert UIMessage[] to CanvasNode[].
 * Each message is parsed into one or more nodes based on content detection.
 */
export function messagesToNodes(messages: UIMessage[]): CanvasNode[] {
  const allNodes: CanvasNode[] = [];

  for (const message of messages) {
    const content = extractMessageContent(message);
    if (!content) continue;

    const nodes = parseContentToNodes(content, message.id, message.role as "user" | "assistant");
    allNodes.push(...nodes);
  }

  return allNodes;
}
