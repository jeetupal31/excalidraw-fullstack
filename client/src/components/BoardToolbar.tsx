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
  error: "Connection Error",
};

export function BoardToolbar({
  boardId,
  connectionStatus,
  isExportingPng,
  isExportingJson,
  onExportPng,
  onExportJson,
}: BoardToolbarProps) {
  return (
    <div className="pointer-events-none absolute left-4 top-4 z-20 flex flex-wrap items-center gap-2 sm:gap-3">
      <div className="pointer-events-auto rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 shadow-sm">
        Board: {boardId}
      </div>

      <div
        className={`pointer-events-auto rounded-full border px-3 py-1 text-xs font-semibold ${statusClasses[connectionStatus]}`}
      >
        {statusLabel[connectionStatus]}
      </div>

      <button
        className="pointer-events-auto rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isExportingPng}
        onClick={onExportPng}
        type="button"
      >
        {isExportingPng ? "Exporting PNG..." : "Export PNG"}
      </button>

      <button
        className="pointer-events-auto rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isExportingJson}
        onClick={onExportJson}
        type="button"
      >
        {isExportingJson ? "Exporting JSON..." : "Export JSON"}
      </button>
    </div>
  );
}
