import { useState } from "react";
import { Sparkles, X, Loader2 } from "lucide-react";
import { generateDiagram, type DiagramGraph } from "../services/ai";

interface AiDiagramModalProps {
  onClose: () => void;
  onGenerated: (graph: DiagramGraph) => void;
}

const EXAMPLES = [
  "User authentication flow with signup, login, and JWT",
  "CI/CD pipeline from commit to deploy",
  "How a request travels through this app",
];

export function AiDiagramModal({ onClose, onGenerated }: AiDiagramModalProps) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    const trimmed = prompt.trim();
    if (!trimmed || loading) {
      return;
    }
    setLoading(true);
    setError(null);

    const { graph, error: generationError } = await generateDiagram(trimmed);
    setLoading(false);

    if (generationError || !graph) {
      setError(generationError ?? "Something went wrong. Please try again.");
      return;
    }

    onGenerated(graph);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400">
              <Sparkles size={18} />
            </span>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Generate with AI</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <p className="mb-3 text-sm text-slate-500 dark:text-zinc-400">
          Describe a diagram or flow and AI will draw it on the board for everyone in the room.
        </p>

        <textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          onKeyDown={(event) => {
            if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
              void submit();
            }
          }}
          rows={3}
          maxLength={500}
          autoFocus
          placeholder="e.g. A user authentication flow with signup, login, and JWT verification"
          className="w-full resize-none rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:ring-indigo-500/30"
        />

        <div className="mt-3 flex flex-wrap gap-2">
          {EXAMPLES.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => setPrompt(example)}
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600 transition hover:border-indigo-300 hover:text-indigo-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:text-indigo-400"
            >
              {example}
            </button>
          ))}
        </div>

        {error && (
          <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-900/10 dark:text-rose-400">
            {error}
          </div>
        )}

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void submit()}
            disabled={loading || !prompt.trim()}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {loading ? "Generating..." : "Generate"}
          </button>
        </div>
      </div>
    </div>
  );
}
