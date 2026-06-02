import { convertToExcalidrawElements } from "@excalidraw/excalidraw";
import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import type { DiagramGraph } from "./ai";

// Derive the skeleton input type directly from the function so we don't depend
// on a deep type path that can change between Excalidraw versions.
type Skeleton = Parameters<typeof convertToExcalidrawElements>[0];

const NODE_WIDTH = 220;
const NODE_HEIGHT = 80;
const VERTICAL_GAP = 70;
const START_X = 240;
const START_Y = 120;

/**
 * Converts an AI-generated graph ({ nodes, edges }) into real Excalidraw
 * elements: each node becomes a labelled rectangle laid out in a vertical
 * flow, and each edge becomes an arrow bound to its source/target nodes
 * (Excalidraw routes the arrows automatically from the bindings).
 */
export function buildDiagramElements(graph: DiagramGraph): ExcalidrawElement[] {
  const skeleton: Skeleton = [];

  graph.nodes.forEach((node, index) => {
    skeleton.push({
      type: "rectangle",
      id: node.id,
      x: START_X,
      y: START_Y + index * (NODE_HEIGHT + VERTICAL_GAP),
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
      backgroundColor: "#e7f5ff",
      strokeColor: "#1971c2",
      roundness: { type: 3 },
      label: { text: node.text },
    });
  });

  graph.edges.forEach((edge) => {
    skeleton.push({
      type: "arrow",
      x: START_X + NODE_WIDTH / 2,
      y: START_Y,
      strokeColor: "#1971c2",
      start: { id: edge.from },
      end: { id: edge.to },
      ...(edge.label ? { label: { text: edge.label } } : {}),
    });
  });

  return convertToExcalidrawElements(skeleton);
}
