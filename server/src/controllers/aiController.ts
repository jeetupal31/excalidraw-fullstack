import type { Request, Response } from "express";

/**
 * AI "text to diagram" controller.
 *
 * Turns a natural-language prompt into a small flowchart graph
 * ({ nodes, edges }) using Groq's free, fast, OpenAI-compatible API.
 * The client converts that graph into real Excalidraw elements.
 *
 * Degrades gracefully: if GROQ_API_KEY is not set, the endpoint returns 503
 * and the UI shows a friendly "AI not configured" message — the rest of the
 * app keeps working.
 */

type DiagramNode = { id: string; text: string };
type DiagramEdge = { from: string; to: string; label?: string };
export type DiagramGraph = { nodes: DiagramNode[]; edges: DiagramEdge[] };

const GROQ_URL = process.env.GROQ_API_URL || "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

const SYSTEM_PROMPT =
  'You convert a description into a simple flowchart graph. ' +
  'Respond with ONLY minified JSON of this exact shape: ' +
  '{"nodes":[{"id":"n1","text":"Short label"}],"edges":[{"from":"n1","to":"n2","label":"optional"}]}. ' +
  "Use at most 10 nodes. Keep each node text under 40 characters. " +
  "Every edge from/to must reference an existing node id. Do not include any prose or markdown.";

function parseGraph(content: string): DiagramGraph | null {
  let raw: unknown;
  try {
    raw = JSON.parse(content);
  } catch {
    return null;
  }
  if (typeof raw !== "object" || raw === null) {
    return null;
  }

  const obj = raw as Record<string, unknown>;
  const nodesRaw = Array.isArray(obj.nodes) ? obj.nodes : [];
  const edgesRaw = Array.isArray(obj.edges) ? obj.edges : [];

  const nodes: DiagramNode[] = [];
  for (const candidate of nodesRaw.slice(0, 12)) {
    if (candidate && typeof candidate === "object") {
      const id = String((candidate as Record<string, unknown>).id ?? "").slice(0, 40);
      const text = String((candidate as Record<string, unknown>).text ?? "").trim().slice(0, 60);
      if (id && text) {
        nodes.push({ id, text });
      }
    }
  }

  const nodeIds = new Set(nodes.map((n) => n.id));
  const edges: DiagramEdge[] = [];
  for (const candidate of edgesRaw.slice(0, 30)) {
    if (candidate && typeof candidate === "object") {
      const from = String((candidate as Record<string, unknown>).from ?? "");
      const to = String((candidate as Record<string, unknown>).to ?? "");
      if (nodeIds.has(from) && nodeIds.has(to) && from !== to) {
        const rawLabel = (candidate as Record<string, unknown>).label;
        const label = rawLabel != null ? String(rawLabel).slice(0, 30) : undefined;
        edges.push({ from, to, label });
      }
    }
  }

  if (nodes.length === 0) {
    return null;
  }
  return { nodes, edges };
}

export function createAiController() {
  const generate = async (req: Request, res: Response): Promise<void> => {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      res.status(503).json({ error: "AI is not configured on this server." });
      return;
    }

    const prompt = typeof req.body?.prompt === "string" ? req.body.prompt.trim() : "";
    if (!prompt) {
      res.status(400).json({ error: "A text prompt is required." });
      return;
    }
    if (prompt.length > 500) {
      res.status(400).json({ error: "Prompt is too long (max 500 characters)." });
      return;
    }

    try {
      const response = await fetch(GROQ_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: prompt },
          ],
          temperature: 0.3,
          max_tokens: 1024,
          response_format: { type: "json_object" },
        }),
      });

      if (!response.ok) {
        const detail = await response.text().catch(() => "");
        console.error("Groq request failed:", response.status, detail.slice(0, 300));
        res.status(502).json({ error: "AI provider request failed. Please try again." });
        return;
      }

      const data = (await response.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const content = data.choices?.[0]?.message?.content ?? "";
      const graph = parseGraph(content);

      if (!graph) {
        res.status(422).json({ error: "AI returned an unexpected format. Try rephrasing your prompt." });
        return;
      }

      res.status(200).json(graph);
    } catch (error) {
      console.error("AI generate error:", error);
      res.status(500).json({ error: "Failed to generate diagram." });
    }
  };

  return { generate };
}
