"use client";

import { useEffect, useRef } from "react";
import {
  useReactFlow,
  useNodesInitialized,
  useStore,
  Node,
  Edge,
  Position,
} from "@xyflow/react";
import dagre from "dagre";

type Direction = "TB" | "LR";

// Gap between parent message right edge and annotation nodes
const ANNOTATION_X_GAP = 200;
// Vertical spacing between stacked annotation nodes
const ANNOTATION_Y_STEP = 160;

/**
 * Hybrid two-pass layout:
 *   1. Dagre top-to-bottom for the main message chain
 *   2. Manual positioning for annotation nodes to the right of their parent
 */
const getLayoutedElements = (
  nodes: Node[],
  edges: Edge[],
  direction: Direction = "TB",
) => {
  // ── Classify nodes ────────────────────────────────────────────
  const messageNodes = nodes.filter(
    (n) => n.type === "canvas-node",
  );
  const annotationNodes = nodes.filter(
    (n) => n.type === "annotation-node",
  );

  // Only message-chain edges go through dagre
  const messageEdges = edges.filter(
    (e) =>
      !e.id.startsWith("annotation-") &&
      !e.source.startsWith("annotation-") &&
      !e.target.startsWith("annotation-"),
  );

  // ── Pass 1: Dagre layout for message nodes ────────────────────
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  const isHorizontal = direction === "LR";
  dagreGraph.setGraph({ rankdir: direction, nodesep: 60, ranksep: 80 });

  messageNodes.forEach((node) => {
    // Use actual measured dimensions if available, otherwise fallback.
    // Add a buffer to the height to account for action buttons, handles,
    // and to guarantee breathing room so nodes never overlap.
    const width = node.measured?.width ?? 400;
    const height = (node.measured?.height ?? 200) + 60;
    dagreGraph.setNode(node.id, { width, height });
  });

  messageEdges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  // Build a lookup of message positions after dagre
  const messagePositions: Record<string, { x: number; y: number; w: number; h: number }> = {};

  const layoutedMessageNodes = messageNodes.map((node) => {
    const dagreNode = dagreGraph.node(node.id);
    const w = node.measured?.width ?? 400;
    const h = node.measured?.height ?? 200;
    // Dagre returns the center point, we need top-left.
    // dagreHeight = h + 60 (the buffer we added). Centering must match.
    const pos = {
      x: dagreNode.x - w / 2,
      y: dagreNode.y - (h + 60) / 2,
    };
    messagePositions[node.id] = { ...pos, w, h };

    return {
      ...node,
      targetPosition: isHorizontal ? Position.Left : Position.Top,
      sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
      position: pos,
    };
  });

  // ── Pass 2: Position annotation nodes to the right of parent ──
  // Group annotations by their parent message
  const annotationsByParent: Record<string, Node[]> = {};
  annotationNodes.forEach((aNode) => {
    // Edge that targets this annotation node — its source is the parent message
    const parentEdge = edges.find((e) => e.target === aNode.id);
    const parentId = parentEdge?.source;
    if (parentId) {
      if (!annotationsByParent[parentId]) annotationsByParent[parentId] = [];
      annotationsByParent[parentId].push(aNode);
    }
  });

  const layoutedAnnotationNodes: Node[] = [];

  Object.entries(annotationsByParent).forEach(([parentId, anns]) => {
    const parent = messagePositions[parentId];
    if (!parent) return;

    // Use measured heights for accurate stacking, with a gap between each
    const ANN_GAP = 20;
    const annHeights = anns.map((a) => a.measured?.height ?? 120);
    const totalAnnHeight = annHeights.reduce((s, h) => s + h, 0) + ANN_GAP * (anns.length - 1);
    // Center the annotation stack vertically relative to the parent node
    const startY = parent.y + (parent.h / 2) - (totalAnnHeight / 2);

    let cumulativeY = Math.max(parent.y, startY);
    anns.forEach((aNode, idx) => {
      const annPos = {
        x: parent.x + parent.w + ANNOTATION_X_GAP,
        y: cumulativeY,
      };
      cumulativeY += annHeights[idx] + ANN_GAP;

      layoutedAnnotationNodes.push({
        ...aNode,
        targetPosition: Position.Left,
        sourcePosition: Position.Bottom,
        position: annPos,
      });
    });
  });

  // Merge all node arrays back together
  const allNodes = [
    ...layoutedMessageNodes,
    ...layoutedAnnotationNodes,
  ];

  return { nodes: allNodes, edges };
};

export function useAutoLayout(direction: Direction = "TB", enabled: boolean = true) {
  const { getNodes, getEdges, setNodes, setEdges, fitView } = useReactFlow();
  const nodesInitialized = useNodesInitialized();

  // Subscribe to store so the effect re-runs when nodes/edges change
  const nodeCount = useStore((s) => s.nodes.length);
  const edgeCount = useStore((s) => s.edges.length);
  // Subscribe to measured dimensions so we re-layout when nodes resize.
  // We use 5px buckets to react promptly to image / diagram loads while
  // avoiding excessive jitter during text streaming.
  const dimensionKey = useStore((s) =>
    s.nodes
      .map(
        (n) =>
          `${n.id}:${Math.round((n.measured?.width ?? 0) / 5)}x${Math.round((n.measured?.height ?? 0) / 5)}`,
      )
      .join("|"),
  );

  // Track what we last laid out to avoid infinite loops
  const prevFingerprintRef = useRef("");

  useEffect(() => {
    if (!nodesInitialized || !enabled) return;

    const nodes = getNodes();
    const edges = getEdges();
    if (nodes.length === 0) return;

    // Build fingerprint from IDs + rounded dimensions
    // This ensures layout re-runs when node content causes a size change
    const fingerprint = nodes
      .map(
        (n) =>
          `${n.id}:${Math.round((n.measured?.width ?? 0) / 5)}x${Math.round((n.measured?.height ?? 0) / 5)}`,
      )
      .sort()
      .join(",");

    if (fingerprint === prevFingerprintRef.current) return;
    prevFingerprintRef.current = fingerprint;

    const { nodes: layoutedNodes, edges: layoutedEdges } =
      getLayoutedElements(nodes, edges, direction);

    setNodes(layoutedNodes);
    setEdges(layoutedEdges);

    window.requestAnimationFrame(() => {
      fitView({ padding: 0.2 });
    });
  }, [
    nodesInitialized,
    enabled,
    nodeCount,
    edgeCount,
    dimensionKey,
    getNodes,
    getEdges,
    setNodes,
    setEdges,
    fitView,
    direction,
  ]);
}
