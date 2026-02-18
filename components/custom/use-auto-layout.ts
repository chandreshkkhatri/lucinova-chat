"use client";

import { useEffect } from "react";
import {
  useReactFlow,
  useNodesInitialized,
  Node,
  Edge,
  Position,
} from "@xyflow/react";
import dagre from "dagre";

type Direction = "TB" | "LR";

// Helper to layout nodes
const getLayoutedElements = (
  nodes: Node[],
  edges: Edge[],
  direction: Direction = "TB",
) => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  const isHorizontal = direction === "LR";
  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    // We need dimensions. If not present (hidden/loading), default to standard size
    // Adjust these based on your actual node content size or measure them
    const width = node.measured?.width ?? 400;
    const height = node.measured?.height ?? 150;
    dagreGraph.setNode(node.id, { width, height });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const newNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      targetPosition: isHorizontal ? Position.Left : Position.Top,
      sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
      // We are shifting the dagre node position (anchor=center center) to the top left
      // so it matches React Flow's anchor point (top left).
      position: {
        x: nodeWithPosition.x - (node.measured?.width ?? 400) / 2,
        y: nodeWithPosition.y - (node.measured?.height ?? 150) / 2,
      },
    };
  });

  return { nodes: newNodes, edges };
};

export function useAutoLayout(direction: Direction = "TB") {
  const { getNodes, getEdges, setNodes, setEdges, fitView } = useReactFlow();
  const nodesInitialized = useNodesInitialized();

  useEffect(() => {
    if (nodesInitialized) {
      const nodes = getNodes();
      const edges = getEdges();

      // Only layout if we have nodes and they haven't been manually moved (optional check)
      // For now, simple auto-layout on generic init
      const { nodes: layoutedNodes, edges: layoutedEdges } =
        getLayoutedElements(nodes, edges, direction);

      setNodes(layoutedNodes);
      setEdges(layoutedEdges);

      window.requestAnimationFrame(() => {
        fitView({ padding: 0.2 });
      });
    }
  }, [
    nodesInitialized,
    getNodes,
    getEdges,
    setNodes,
    setEdges,
    fitView,
    direction,
  ]);
}
