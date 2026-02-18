"use client";

import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  ReactFlowProvider,
  useReactFlow,
} from "@xyflow/react";
import { Message } from "@/lib/chat-utils";
import { Sparkles, Reply, MessageSquare, FileCode } from "lucide-react";
import Image from "next/image";
import { Dispatch, SetStateAction, useEffect, useCallback, useState, useRef } from "react";
import "@xyflow/react/dist/style.css";

import { messagesToNodes } from "@/lib/message-to-nodes";

import { CanvasNodeComponent, CanvasNodeData } from "./canvas-node";
import { ChatInput } from "./chat-input";
import { SavedAnnotation } from "./enhanced-message";
import { Attachment } from "./types";
import { useAutoLayout } from "./use-auto-layout";

import type { NodeType } from "@/lib/message-to-nodes";

interface CanvasProps {
  messages: Message[];
  status: "idle" | "streaming" | "submitted" | "error";
  isThread: boolean;
  chatId: string;
  annotationsByMessage: Record<string, SavedAnnotation[]>;
  onStartThread: (messageId: string, selectedText?: string) => void;
  onAskLucinova: (messageId: string, selectedText: string) => void;
  onOpenAnnotation: (annotationId: string, selectedText: string) => void;
  setInput: (value: string) => void;
  selectedText?: string;
  // Input props (only used for thread mode)
  input: string;
  handleSubmit: (e?: React.FormEvent) => void;
  stop: () => void;
  attachments: Attachment[];
  setAttachments: Dispatch<SetStateAction<Attachment[]>>;
  sendMessage: (message: {
    text: string;
    files?: any[];
    options?: { body?: any };
  }) => Promise<void>;
  isGuest: boolean;
  usageLimitInfo: {
    exceeded: boolean;
    isPro: boolean;
    currentUsage: number;
    limit: number;
    periodEnd: Date | string;
  } | null;
  onEditMessage?: (messageId: string, newText: string) => void;
  onRegenerate?: () => void;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  isUserPro?: boolean;
}

const nodeTypes = {
  "canvas-node": CanvasNodeComponent,
};

function CanvasGraph({
  messages,
  status,
  isThread,
  chatId,
  annotationsByMessage,
  ...props
}: CanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<CanvasNodeData>>(
    [],
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  // fitView removed as unused

  const nodesRef = useRef(nodes);
  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  // Auto layout hook
  useAutoLayout("TB");

  // Sync messages to nodes/edges
  useEffect(() => {
    // 1. Transform messages to nodes
    const newNodes: Node<CanvasNodeData>[] = messages.map((msg, index) => {
      // Find existing node to preserve position if it exists
      const existingNode = nodesRef.current.find((n) => n.id === msg.id);

      const role =
        msg.role === "system"
          ? "system"
          : msg.role === "user"
            ? "user"
            : "assistant";

      const textPart = msg.parts?.find((p: any) => p.type === "text");
      const content = textPart && "text" in textPart ? textPart.text : "";

      // Determine type based on content
      const type = content.startsWith("```mermaid")
        ? "mermaid"
        : content.startsWith("```")
          ? "code"
          : "text";

      // Detect language for code blocks
      const language =
        type === "code"
          ? content.split("\n")[0].replace("```", "").trim()
          : undefined;

      return {
        id: msg.id,
        type: "canvas-node",
        position: existingNode?.position || { x: 0, y: index * 200 },
        data: {
          message: msg,
          chatId,
          annotations: annotationsByMessage[msg.id],
          onAskLucinova: props.onAskLucinova,
          onOpenAnnotation: props.onOpenAnnotation,
          onStartThread: props.onStartThread,
          isThread,
          showActions: !isThread,
          onEditMessage: props.onEditMessage,
          onRegenerate: props.onRegenerate,
          isLastAssistantMessage:
            msg.role === "assistant" && index === messages.length - 1,
          type: type as any,
          content,
          language,
          role: role as any,
        },
      };
    });

    // 2. Create Edges
    const newEdges: Edge[] = [];
    for (let i = 0; i < messages.length - 1; i++) {
      const source = messages[i].id;
      const target = messages[i + 1].id;
      newEdges.push({
        id: `${source}-${target}`,
        source,
        target,
        type: "default",
        animated: true,
        style: { stroke: "hsl(var(--muted-foreground))", opacity: 0.5 },
      });
    }

    setNodes(newNodes);
    setEdges(newEdges);
  }, [
    messages,
    chatId,
    isThread,
    annotationsByMessage,
    props.onAskLucinova,
    props.onOpenAnnotation,
    props.onStartThread,
    props.onEditMessage,
    props.onRegenerate,
    setEdges,
    setNodes,
  ]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  return (
    <div className="size-full bg-background/50">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.1}
        maxZoom={4}
        defaultEdgeOptions={{ type: "smoothstep" }}
        proOptions={{ hideAttribution: true }}
        onNodeClick={(_event, node) => {
          // Selection handled by ReactFlow UI, sidebar details removed
        }}
        onPaneClick={() => {
          // Deselection handled by ReactFlow UI, sidebar details removed
        }}
      >
        <Background
          gap={20}
          size={1}
          color="hsl(var(--muted-foreground))"
          className="opacity-20"
        />
        <Controls className="bg-background border-border text-foreground fill-foreground" />
      </ReactFlow>
    </div>
  );
}

export function Canvas(props: CanvasProps) {
  const [selectedNodeType, setSelectedNodeType] = useState<NodeType>("text");

  return (
    <ReactFlowProvider>
      <div className="size-full flex flex-col relative">
        <div className="flex-1 overflow-hidden">
          {props.messages.length === 0 ? (
            <EmptyState {...props} />
          ) : (
            <CanvasGraph {...props} />
          )}
        </div>

        {/* Floating Input Area */}
        <ChatInput
          input={props.input}
          setInput={props.setInput}
          isLoading={
            props.status === "streaming" || props.status === "submitted"
          }
          stop={props.stop}
          attachments={props.attachments}
          setAttachments={props.setAttachments}
          messages={props.messages}
          sendMessage={props.sendMessage}
          handleSubmit={props.handleSubmit}
          selectedNodeType={selectedNodeType}
          setSelectedNodeType={setSelectedNodeType}
          usageLimitInfo={props.usageLimitInfo}
          variant="floating"
          selectedModel={props.selectedModel}
          setSelectedModel={props.setSelectedModel}
          isUserPro={props.isUserPro}
        />
      </div>
    </ReactFlowProvider>
  );
}

function EmptyState({ isThread, selectedText, setInput }: CanvasProps) {
  if (isThread && selectedText) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center max-w-md">
          <div className="size-12 mx-auto mb-4 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center">
            <Sparkles className="size-6 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Ask about your selection
          </h3>
          <p className="text-muted-foreground mb-6 text-sm">
            What would you like to know about the selected text?
          </p>
          <div className="flex flex-col gap-2 mb-4">
            {[
              "Can you explain this in simpler terms?",
              "What are the key points here?",
              "Can you provide more context about this?",
              "How does this relate to the main topic?",
            ].map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => setInput(suggestion)}
                className="p-3 text-left rounded-lg border border-border hover:bg-muted transition-colors"
              >
                <p className="text-sm text-foreground/80">{suggestion}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isThread) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center max-w-md">
          <div className="size-12 mx-auto mb-4 rounded-xl bg-muted border border-border flex items-center justify-center">
            <Reply className="size-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Thread Discussion
          </h3>
          <p className="text-muted-foreground mb-6 text-sm">
            Continue the conversation about the parent message.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-center justify-start h-full overflow-hidden">
      {/* Decorative floating cards - hidden on mobile */}
      <div
        className="absolute inset-0 pointer-events-none hidden md:block"
        aria-hidden="true"
      >
        {[
          {
            label: "Ideas",
            icon: <Sparkles className="size-4" />,
            position: { top: "14%", left: "8%" },
            rotation: "-3deg",
            floatDuration: "6s",
            animDelay: "0s",
          },
          {
            label: "Threads",
            icon: <Reply className="size-4" />,
            position: { top: "18%", right: "8%" },
            rotation: "2deg",
            floatDuration: "7s",
            animDelay: "1.5s",
          },
          {
            label: "Notes",
            icon: <MessageSquare className="size-4" />,
            position: { bottom: "35%", left: "8%" },
            rotation: "2.5deg",
            floatDuration: "8s",
            animDelay: "0.8s",
          },
          {
            label: "Code",
            icon: <FileCode className="size-4" />,
            position: { bottom: "30%", right: "8%" },
            rotation: "-2deg",
            floatDuration: "6.5s",
            animDelay: "2s",
          },
        ].map((card, i) => (
          <div
            key={card.label}
            className="absolute flex items-center gap-2 px-3 py-2 rounded-lg border border-border/60 bg-card/80 dark:bg-card/60 backdrop-blur-sm shadow-sm text-muted-foreground"
            style={{
              ...card.position,
              transform: `rotate(${card.rotation})`,
              animation: `canvas-fade-in-up 600ms ease-out ${200 + i * 150}ms forwards, canvas-float ${card.floatDuration} ease-in-out ${card.animDelay} infinite`,
              opacity: 0,
            }}
          >
            {card.icon}
            <span className="text-xs font-medium">{card.label}</span>
          </div>
        ))}
      </div>

      {/* Center content — matches Chat empty state structure */}
      <div
        className="relative z-20 flex flex-col items-center text-center p-8 pt-16 max-w-md w-full"
        style={{
          animation: "canvas-fade-in-up 600ms ease-out 100ms forwards",
          opacity: 0,
        }}
      >
        <div className="size-16 mx-auto mb-4 rounded-xl flex items-center justify-center">
          <Image
            src="/images/lucidity-logo.svg"
            alt="Lucidity"
            width={64}
            height={64}
            className="size-full object-contain"
          />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Lucidity Canvas
        </h2>
        <p className="text-muted-foreground max-w-md">
          Your thinking space. Ask questions, explore ideas, and branch into
          threads.
        </p>
      </div>
    </div>
  );
}
