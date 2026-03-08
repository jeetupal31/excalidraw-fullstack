import { useState } from "react";
import type { ConnectionStatus } from "../hooks/useWebSocket";

interface BoardToolbarProps {
  boardId: string;
  connectionStatus: ConnectionStatus;
  isExportingPng: boolean;
  isExportingJson: boolean;
  onExportPng: () => void;
  onExportJson: () => void;
}

const statusClasses: Record<ConnectionStatus, string> = {
  connecting: "bg-amber-100 text-amber-800 border-amber-200",
  open: "bg-emerald-100 text-emerald-800 border-emerald-200",
  closed: "bg-slate-200 text-slate-700 border-slate-300",
  error: "bg-rose-100 text-rose-800 border-rose-200",
};

const statusLabel: Record<ConnectionStatus, string> = {
  connecting: "Connecting",
  open: "Live",
  closed: "Disconnected",
  error: "Error",
};

const statusDotColor: Record<ConnectionStatus, string> = {
  connecting: "bg-amber-400",
  open: "bg-emerald-400 animate-pulse",
  closed: "bg-slate-400",
  error: "bg-rose-400",
};

export function BoardToolbar({
  boardId,
  connectionStatus,
  isExportingPng,
  isExportingJson,
  onExportPng,
  onExportJson,
}: BoardToolbarProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyBoardId = async () => {
    try {
      await navigator.clipboard.writeText(boardId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard might not be available
    }
  };

  return (
    <div className="pointer-events-none absolute left-2 top-2 z-20 flex max-w-[calc(100%-1rem)] flex-wrap items-center gap-1.5 sm:left-4 sm:top-4 sm:gap-2 md:gap-3">
      <button
        className="pointer-events-auto flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600 shadow-sm transition hover:bg-slate-50 sm:px-3 sm:text-xs"
        onClick={handleCopyBoardId}
        type="button"
        title="Click to copy board ID"
      >
        <span className="max-w-[80px] truncate sm:max-w-[120px] md:max-w-none">{boardId}</span>
        <span className="ml-0.5 text-[10px]">{copied ? "✓" : "📋"}</span>
      </button>

      <div
        className={`pointer-events-auto flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold sm:px-3 sm:text-xs ${statusClasses[connectionStatus]}`}
      >
        <span className={`inline-block h-1.5 w-1.5 rounded-full ${statusDotColor[connectionStatus]}`} />
        {statusLabel[connectionStatus]}
      </div>

      <button
        className="pointer-events-auto rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 sm:px-3 sm:text-xs"
        disabled={isExportingPng}
        onClick={onExportPng}
        type="button"
      >
        {isExportingPng ? "Exporting..." : "PNG"}
      </button>

      <button
        className="pointer-events-auto rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 sm:px-3 sm:text-xs"
        disabled={isExportingJson}
        onClick={onExportJson}
        type="button"
      >
        {isExportingJson ? "Exporting..." : "JSON"}
      </button>
    </div>
  );
}
