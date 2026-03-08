import { useState, useEffect } from "react";
import { 
  X, 
  RotateCcw, 
  Calendar, 
  Clock, 
  Inbox, 
  AlertCircle,
  Plus
} from "lucide-react";
import { apiRequest } from "../services/apiClient";

interface Version {
  id: string;
  createdAt: string;
}

interface VersionHistoryProps {
  boardId: string;
  isViewer: boolean;
  onRestore: () => void;
  onClose: () => void;
}

export function VersionHistory({ boardId, isViewer, onRestore, onClose }: VersionHistoryProps) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRestoring, setIsRestoring] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchVersions = async () => {
    setIsLoading(true);
    setError(null);
    const result = await apiRequest<{ versions: Version[] }>(`/api/boards/${boardId}/versions`);
    if (result.data) {
      setVersions(result.data.versions);
    } else {
      setError(result.error ?? "Failed to fetch versions");
    }
    setIsLoading(false);
  };

  useEffect(() => {
    void fetchVersions();
  }, [boardId]);

  const handleSaveVersion = async () => {
    setIsSaving(true);
    setError(null);
    const result = await apiRequest(`/api/boards/${boardId}/versions`, {
      method: "POST",
    });
    if (result.data) {
      await fetchVersions();
    } else {
      setError(result.error ?? "Failed to save version");
    }
    setIsSaving(false);
  };

  const handleRestoreVersion = async (versionId: string) => {
    if (!window.confirm("Restore this version? Unsaved changes will be overwritten.")) {
      return;
    }

    setIsRestoring(versionId);
    setError(null);
    const result = await apiRequest(`/api/boards/${boardId}/restore`, {
      method: "POST",
      body: JSON.stringify({ versionId }),
    });

    if (result.data) {
      onRestore();
    } else {
      setError(result.error ?? "Failed to restore version");
    }
    setIsRestoring(null);
  };

  return (
    <div className="flex h-full flex-col border-l border-slate-100 bg-white/60 backdrop-blur-3xl dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="flex items-center justify-between border-b border-slate-100 p-6 dark:border-zinc-800">
        <div>
          <h2 className="text-base font-black tracking-tight text-slate-900 dark:text-white uppercase">Artifact Ledger</h2>
          <p className="mt-1 text-[11px] font-bold text-slate-400 dark:text-zinc-600 uppercase tracking-widest">Version Snapshots</p>
        </div>
        <button
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-50 text-slate-400 transition hover:bg-slate-100 hover:text-slate-900 dark:bg-zinc-900 dark:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          onClick={onClose}
          title="Close Ledger"
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-100 bg-red-50 p-4 text-xs font-bold text-red-700 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-400">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {!isViewer && (
          <button
            className="mb-8 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-4 text-[13px] font-bold tracking-wide text-white transition-all hover:bg-black disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-zinc-200"
            disabled={isSaving}
            onClick={handleSaveVersion}
          >
            {isSaving ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white dark:border-slate-900/30 dark:border-t-slate-900" />
            ) : (
              <>
                <Plus size={18} strokeWidth={3} />
                <span>Save New Snapshot</span>
              </>
            )}
          </button>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-100 border-t-indigo-600 dark:border-zinc-800 dark:border-t-indigo-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-700">Syncing history...</span>
          </div>
        ) : versions.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-12 text-center dark:border-zinc-800 dark:bg-zinc-900/30">
            <Inbox size={32} className="text-slate-300 dark:text-zinc-700 mb-4" />
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-600">Ledger is empty</p>
          </div>
        ) : (
          <div className="space-y-3">
            {versions.map((version) => (
              <div
                key={version.id}
                className="group relative flex flex-col rounded-xl border border-slate-100 bg-white/80 p-5 transition-all hover:border-indigo-100 hover:shadow-xl hover:shadow-slate-200/20 dark:border-zinc-900 dark:bg-zinc-900/40 dark:hover:border-indigo-900/50 dark:hover:shadow-none"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[13px] font-bold text-slate-900 dark:text-slate-200">
                      <Calendar size={14} className="text-slate-400" />
                      {new Date(version.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 dark:text-zinc-600 uppercase tracking-wider">
                      <Clock size={12} strokeWidth={2.5} />
                      {new Date(version.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  {!isViewer && (
                    <button
                      className="flex h-9 items-center gap-2 rounded-lg bg-indigo-50 px-4 text-[11px] font-black text-indigo-700 uppercase tracking-widest opacity-0 transition group-hover:opacity-100 disabled:opacity-50 dark:bg-indigo-900/20 dark:text-indigo-400 lg:opacity-100"
                      disabled={isRestoring === version.id}
                      onClick={() => handleRestoreVersion(version.id)}
                    >
                      {isRestoring === version.id ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-700 border-t-transparent dark:border-indigo-400" />
                      ) : (
                        <>
                          <RotateCcw size={14} strokeWidth={3} />
                          <span>Restore</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
