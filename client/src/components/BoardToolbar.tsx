import { useState } from "react";
import { 
  Link as LinkIcon, 
  Eye, 
  Download, 
  FileJson, 
  History, 
  Check, 
  Activity,
  AlertTriangle,
  Wifi,
  WifiOff
} from "lucide-react";
import type { ConnectionStatus } from "../hooks/useWebSocket";

interface BoardToolbarProps {
  boardId: string;
  connectionStatus: ConnectionStatus;
  isExportingPng: boolean;
  isExportingJson: boolean;
  onExportPng: () => void;
  onExportJson: () => void;
  isViewer: boolean;
  onToggleHistory: () => void;
}

const statusClasses: Record<ConnectionStatus, string> = {
  connecting: "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/10 dark:text-amber-400 dark:border-amber-900/30",
  open: "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/10 dark:text-emerald-400 dark:border-emerald-900/30",
  closed: "bg-slate-50 text-slate-600 border-slate-100 dark:bg-zinc-900/30 dark:text-zinc-500 dark:border-zinc-800",
  error: "bg-rose-50 text-rose-700 border-red-100 dark:bg-red-900/10 dark:text-red-400 dark:border-red-900/30",
};

const statusIcon: Record<ConnectionStatus, any> = {
  connecting: Activity,
  open: Wifi,
  closed: WifiOff,
  error: AlertTriangle,
};

export function BoardToolbar({
  boardId,
  connectionStatus,
  isExportingPng,
  isExportingJson,
  onExportPng,
  onExportJson,
  isViewer,
  onToggleHistory,
}: BoardToolbarProps) {
  const [copiedType, setCopiedType] = useState<"editor" | "viewer" | null>(null);

  const handleCopyLink = async (role: "editor" | "viewer") => {
    try {
      const url = new URL(window.location.href);
      if (role === "viewer") {
        url.searchParams.set("role", "viewer");
      } else {
        url.searchParams.delete("role");
      }
      
      await navigator.clipboard.writeText(url.toString());
      setCopiedType(role);
      setTimeout(() => setCopiedType(null), 2000);
    } catch {
      // clipboard might not be available
    }
  };

  const StatusIcon = statusIcon[connectionStatus];

  return (
    <div className="pointer-events-none absolute left-1/2 bottom-8 z-20 flex w-full max-w-fit -translate-x-1/2 flex-wrap items-center justify-center gap-2 sm:bottom-10 sm:gap-3">
      <div className="glass-panel pointer-events-auto flex items-center gap-1.5 rounded-2xl p-2 shadow-2xl">
        {isViewer && (
          <div className="flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-1.5 text-[10px] font-bold tracking-widest uppercase text-white shadow-sm dark:bg-white dark:text-slate-900 sm:text-xs">
            <Eye size={14} />
            <span>Viewer Mode: {boardId.substring(0, 6)}</span>
          </div>
        )}

        {!isViewer && (
          <div className="flex items-center gap-1.5 rounded-xl bg-white/50 p-1 dark:bg-zinc-900/50">
            <span className="hidden pl-3 pr-2 text-[10px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-widest sm:inline-block">
              {boardId.substring(0, 8)}
            </span>
            <div className="hidden h-5 w-px bg-slate-200 dark:bg-zinc-800 sm:block" />
            <button
              className="glass-button flex items-center gap-2 rounded-lg px-3 py-2 text-[11px] font-bold text-slate-700 sm:text-xs dark:text-zinc-300"
              onClick={() => handleCopyLink("editor")}
              type="button"
              title="Copy Editor Link"
            >
              {copiedType === "editor" ? <Check size={14} className="text-emerald-500" /> : <LinkIcon size={14} />}
              <span>{copiedType === "editor" ? "Copied" : "Edit Link"}</span>
            </button>
            <button
              className="glass-button flex items-center gap-2 rounded-lg px-3 py-2 text-[11px] font-bold text-slate-700 sm:text-xs dark:text-zinc-300"
              onClick={() => handleCopyLink("viewer")}
              type="button"
              title="Copy Viewer Link"
            >
              {copiedType === "viewer" ? <Check size={14} className="text-emerald-500" /> : <Eye size={14} />}
              <span>{copiedType === "viewer" ? "Copied" : "View Link"}</span>
            </button>
          </div>
        )}

        <div className="h-5 w-px bg-slate-200 dark:bg-zinc-800" />

        <div
          className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-[11px] font-bold transition-colors ${statusClasses[connectionStatus]}`}
          title={`Status: ${connectionStatus}`}
        >
          <StatusIcon size={14} strokeWidth={connectionStatus === 'open' ? 3 : 2} className={connectionStatus === 'open' ? 'animate-pulse' : ''} />
          <span className="hidden sm:inline-block uppercase tracking-wider">{connectionStatus}</span>
        </div>

        <div className="h-5 w-px bg-slate-200 dark:bg-zinc-800" />

        <div className="flex items-center gap-1.5">
          <button
            className="glass-button flex items-center gap-2 rounded-lg px-3 py-2 text-[11px] font-bold text-slate-700 disabled:opacity-30 dark:text-zinc-300"
            disabled={isExportingPng}
            onClick={onExportPng}
            type="button"
            title="Download PNG"
          >
            <Download size={14} />
            <span className="hidden sm:inline-block">PNG</span>
          </button>

          <button
            className="glass-button flex items-center gap-2 rounded-lg px-3 py-2 text-[11px] font-bold text-slate-700 disabled:opacity-30 dark:text-zinc-300"
            disabled={isExportingJson}
            onClick={onExportJson}
            type="button"
            title="Download JSON"
          >
            <FileJson size={14} />
            <span className="hidden sm:inline-block">JSON</span>
          </button>
        </div>

        <div className="h-5 w-px bg-slate-200 dark:bg-zinc-800" />

        <button
          className="glass-button flex items-center gap-2 rounded-lg px-3 py-2 text-[11px] font-bold text-slate-700 transition-colors hover:text-indigo-600 dark:text-zinc-200 dark:hover:text-indigo-400"
          onClick={onToggleHistory}
          type="button"
          title="Version History"
        >
          <History size={15} />
          <span className="hidden sm:inline-block">History</span>
        </button>
      </div>
    </div>
  );
}
