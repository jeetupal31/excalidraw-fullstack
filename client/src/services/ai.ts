import { apiRequest } from "./apiClient";

export interface DiagramNode {
  id: string;
  text: string;
}

export interface DiagramEdge {
  from: string;
  to: string;
  label?: string;
}

export interface DiagramGraph {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
}

/**
 * Asks the server's AI endpoint to turn a text prompt into a flowchart graph.
 * Returns either a graph or a human-readable error message (never throws).
 */
export async function generateDiagram(prompt: string): Promise<{ graph?: DiagramGraph; error?: string }> {
  const response = await apiRequest<DiagramGraph>("/api/ai/generate", {
    method: "POST",
    body: JSON.stringify({ prompt }),
  });

  if (response.error || !response.data) {
    return { error: response.error ?? "Failed to generate diagram." };
  }

  return { graph: response.data };
}
