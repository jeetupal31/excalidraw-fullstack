import type { FormEvent } from "react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  Zap, 
  Users, 
  Database, 
  ShieldCheck, 
  Plus, 
  LogIn, 
  Pencil, 
  Trash2, 
  Clock, 
  ArrowRight,
  ExternalLink
} from "lucide-react";
import { useBoardNavigation } from "../hooks/useBoardNavigation";
import { useAuth } from "../contexts/AuthContext";
import { apiRequest } from "../services/apiClient";

interface BoardInfo {
  id: string;
  name: string;
  role: string;
  updatedAt: string;
}

const featureHighlights = [
  {
    icon: Zap,
    title: "Realtime Drawing",
    description: "Collaborate instantly with synchronized scene updates over WebSockets.",
  },
  {
    icon: Users,
    title: "Live Cursors & Presence",
    description: "See where collaborators are active with shared cursors and presence indicators.",
  },
  {
    icon: Database,
    title: "Persistent Boards",
    description: "Room state is saved in PostgreSQL so ideas remain accessible across sessions.",
  },
  {
    icon: ShieldCheck,
    title: "Secure Access",
    description: "Manage your boards with robust JWT authentication and role-based access.",
  },
];

const workflowSteps = [
  { step: "01", text: "Create a private board to generate a unique session ID." },
  { step: "02", text: "Invite collaborators with a secure board link or ID." },
  { step: "03", text: "Sketch together in high-fidelity and export your work." },
];

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;

  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function Home() {
  const [joinBoardIdInput, setJoinBoardIdInput] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);
  const { createBoard, joinBoard } = useBoardNavigation();
  const { isAuthenticated } = useAuth();

  const [myBoards, setMyBoards] = useState<BoardInfo[]>([]);
  const [boardsLoading, setBoardsLoading] = useState(false);
  
  const [editingBoardId, setEditingBoardId] = useState<string | null>(null);
  const [editBoardName, setEditBoardName] = useState("");
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setMyBoards([]);
      return;
    }

    const fetchBoards = async () => {
      setBoardsLoading(true);
      const result = await apiRequest<{ boards: BoardInfo[] }>("/api/boards");
      if (result.data) {
        setMyBoards(result.data.boards);
      }
      setBoardsLoading(false);
    };

    void fetchBoards();
  }, [isAuthenticated]);

  const handleRenameBoard = async (boardId: string) => {
    if (!editBoardName.trim()) {
      setEditingBoardId(null);
      return;
    }
    
    setMyBoards(prev => prev.map(b => b.id === boardId ? { ...b, name: editBoardName.trim() } : b));
    setEditingBoardId(null);
    
    const result = await apiRequest(`/api/boards/${boardId}`, {
      method: "PATCH",
      body: JSON.stringify({ name: editBoardName.trim() }),
    });

    if (result.error) {
      setJoinError(result.error);
    }
  };

  const handleDeleteBoard = async (boardId: string) => {
    if (!window.confirm("Are you sure you want to delete this board?")) return;
    
    setIsDeleting(boardId);
    const result = await apiRequest(`/api/boards/${boardId}`, {
      method: "DELETE",
    });

    if (!result.error) {
      setMyBoards(prev => prev.filter(b => b.id !== boardId));
    } else {
      setJoinError(result.error);
    }
    setIsDeleting(null);
  };

  const handleCreateBoard = () => {
    if (!isAuthenticated) {
      window.location.href = "/login";
      return;
    }
    setJoinError(null);
    createBoard();
  };

  const handleJoinBoard = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isAuthenticated) {
      window.location.href = "/login";
      return;
    }

    const result = joinBoard(joinBoardIdInput);
    if (!result.success) {
      setJoinError(result.error ?? "Could not join this board.");
      return;
    }
    setJoinError(null);
  };

  return (
    <div className="relative h-full overflow-y-auto">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 pt-32 pb-20 sm:gap-16">
        {/* Hero Section */}
        <section className="grid gap-12 lg:grid-cols-[1.2fr_1fr]">
          <div className="flex flex-col justify-center space-y-6">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50/50 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-indigo-700 backdrop-blur-sm dark:border-indigo-900/30 dark:bg-indigo-500/10 dark:text-indigo-400">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-indigo-500"></span>
              </span>
              Realtime Collaboration
            </span>
            <h1 className="max-w-2xl text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl md:text-6xl dark:text-white">
              <span className="bg-gradient-to-r from-slate-900 to-slate-500 bg-clip-text text-transparent dark:from-white dark:to-zinc-500">ExcaliDraw Live</span>
              <br />
              <span className="font-medium text-slate-500 dark:text-zinc-400">Whiteboarding redefined.</span>
            </h1>
            <p className="max-w-xl text-base leading-relaxed text-slate-600 dark:text-zinc-400">
              High-fidelity collaborative sketching for technical teams. 
              Sync designs instantly, track presence, and persist boards securely.
            </p>
            <div className="flex pt-2">
              <button
                className="group relative flex items-center gap-2 overflow-hidden rounded-xl bg-slate-900 px-7 py-4 text-sm font-bold tracking-wide text-white shadow-xl shadow-slate-950/20 transition-all hover:-translate-y-0.5 hover:bg-indigo-600 hover:shadow-indigo-500/20 dark:bg-white dark:text-slate-900 dark:hover:bg-zinc-200"
                onClick={handleCreateBoard}
                type="button"
              >
                <Plus size={18} strokeWidth={3} />
                <span>Create New Board</span>
              </button>
            </div>
          </div>

          <form
            className="glass-panel h-fit rounded-2xl p-8"
            onSubmit={handleJoinBoard}
          >
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Join Workspace</h2>
            <p className="mt-2 text-sm font-medium text-slate-500 dark:text-zinc-500">
              Enter a board ID to collaborate with your team.
            </p>
            <div className="mt-8 space-y-2">
              <label className="ml-1 text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                Board Identifier
              </label>
              <input
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-medium text-slate-800 shadow-sm transition-all focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-white/5 dark:bg-zinc-800 dark:text-slate-200 dark:focus:border-indigo-500"
                onChange={(event) => setJoinBoardIdInput(event.target.value)}
                placeholder="e.g. board-id-001"
                type="text"
                value={joinBoardIdInput}
              />
            </div>
            {joinError ? <p className="mt-3 rounded-lg border border-red-100 bg-red-50 p-2.5 px-3 text-xs font-semibold text-red-700 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-400">{joinError}</p> : null}
            <button
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-4 text-sm font-bold tracking-wide text-slate-900 transition-all hover:bg-slate-200 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700"
              type="submit"
            >
              <LogIn size={18} />
              Join Board
            </button>
          </form>
        </section>

        {/* My Boards Section */}
        {isAuthenticated && (
          <section className="glass-panel rounded-2xl p-8">
            <div className="flex items-center justify-between pb-2">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Recent Artifacts</h2>
              <Clock size={20} className="text-slate-300 dark:text-zinc-700" />
            </div>
            
            {boardsLoading ? (
              <div className="mt-8 flex items-center gap-3 text-sm font-bold text-slate-400">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600 dark:border-zinc-800 dark:border-t-indigo-500" />
                Synchronizing workspace...
              </div>
            ) : myBoards.length === 0 ? (
              <div className="mt-8 rounded-2xl border border-dashed border-slate-200 bg-slate-50/30 p-12 text-center dark:border-zinc-800 dark:bg-zinc-900/30">
                <p className="text-sm font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">No active boards found</p>
                <button
                  className="mt-6 rounded-full border border-slate-200 bg-white px-6 py-2.5 text-xs font-bold tracking-widest text-slate-900 uppercase transition hover:border-slate-300 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:hover:border-zinc-700"
                  onClick={handleCreateBoard}
                  type="button"
                >
                  Initialize First Board
                </button>
              </div>
            ) : (
              <div className="mt-8 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                {myBoards.map((board) => (
                  <div
                    key={board.id}
                    className="glass-button group relative flex min-h-[160px] flex-col rounded-xl p-6 transition-all hover:border-indigo-200 dark:hover:border-indigo-900/50"
                  >
                    <div className="mb-4">
                      {editingBoardId === board.id ? (
                        <input
                          autoFocus
                          className="w-full rounded-lg border border-indigo-500/50 bg-white px-3 py-2 text-sm font-bold text-slate-900 outline-none ring-4 ring-indigo-500/10 dark:bg-zinc-900 dark:text-white"
                          value={editBoardName}
                          onChange={(e) => setEditBoardName(e.target.value)}
                          onBlur={() => handleRenameBoard(board.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleRenameBoard(board.id);
                            if (e.key === "Escape") setEditingBoardId(null);
                          }}
                        />
                      ) : (
                        <Link to={`/board/${board.id}`} className="flex items-start justify-between gap-2">
                          <span className="truncate text-lg font-bold text-slate-900 transition group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400">
                            {board.name}
                          </span>
                          <ExternalLink size={14} className="mt-1 flex-shrink-0 opacity-0 transition group-hover:opacity-100 text-slate-400" />
                        </Link>
                      )}
                    </div>
                    
                    <div className="mt-auto flex items-end justify-between">
                      <div className="flex flex-col gap-1.5">
                        <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-zinc-600">
                          ID: {board.id.substring(0, 8)}
                        </span>
                        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-zinc-500">
                          <Clock size={12} strokeWidth={2.5} />
                          <span>{timeAgo(board.updatedAt)}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                        {board.role !== "viewer" && (
                          <button
                            className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-slate-400 shadow-sm ring-1 ring-slate-200 transition hover:text-indigo-600 dark:bg-zinc-800 dark:text-zinc-500 dark:ring-zinc-700 dark:hover:text-indigo-400"
                            title="Rename"
                            onClick={(e) => {
                              e.preventDefault();
                              setEditBoardName(board.name);
                              setEditingBoardId(board.id);
                            }}
                          >
                            <Pencil size={15} />
                          </button>
                        )}
                        <button
                          className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-slate-400 shadow-sm ring-1 ring-slate-200 transition hover:text-red-600 dark:bg-zinc-800 dark:text-zinc-500 dark:ring-zinc-700 dark:hover:text-red-400"
                          title="Delete"
                          disabled={isDeleting === board.id}
                          onClick={(e) => {
                            e.preventDefault();
                            handleDeleteBoard(board.id);
                          }}
                        >
                          {isDeleting === board.id ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
                          ) : (
                            <Trash2 size={15} />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Features Section */}
        <section className="glass-panel rounded-2xl p-8">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Precision Infrastructure</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {featureHighlights.map((feature) => (
              <article
                key={feature.title}
                className="group flex flex-col p-2"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white shadow-lg shadow-slate-900/10 transition-transform group-hover:-translate-y-1 dark:bg-white dark:text-slate-900">
                  <feature.icon size={22} strokeWidth={2.5} />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">{feature.title}</h3>
                <p className="mt-3 text-[13px] font-medium leading-relaxed text-slate-500 dark:text-zinc-500">{feature.description}</p>
              </article>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="grid gap-12 lg:grid-cols-[1fr_1.2fr]">
          <div className="flex flex-col justify-center">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Workflow Integration</h2>
            <div className="mt-10 space-y-3">
              {workflowSteps.map((item) => (
                <div
                  key={item.step}
                  className="flex items-center gap-5 rounded-xl border border-slate-100 bg-white/50 p-5 dark:border-zinc-800 dark:bg-zinc-900/30"
                >
                  <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-slate-900 text-[13px] font-black text-white dark:bg-white dark:text-slate-900">
                    {item.step}
                  </span>
                  <span className="text-sm font-bold text-slate-600 dark:text-zinc-400">{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl bg-slate-900 p-10 text-white dark:border dark:border-white/5 dark:bg-zinc-950">
            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-indigo-600/10 blur-3xl opacity-50" />
            <div className="relative z-10 flex h-full flex-col justify-center">
              <h3 className="text-3xl font-bold tracking-tight">Ready to ship?</h3>
              <p className="mt-4 max-w-sm text-[15px] font-medium leading-relaxed text-slate-400">
                Launch a collaborative session in seconds. Built for high-fidelity technical sketching and system design.
              </p>
              <button
                className="mt-10 flex w-fit items-center gap-2 rounded-xl bg-white px-8 py-4 font-bold text-slate-900 transition-all hover:bg-indigo-50 hover:text-indigo-600"
                onClick={handleCreateBoard}
                type="button"
              >
                <span>Launch Workspace</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-10 border-t border-slate-100 dark:border-zinc-800 pt-10 pb-6 text-center">
          <div className="flex flex-col items-center gap-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-zinc-600">
              © 2026 EXCALIDRAW LIVE · BY {" "}
              <a
                className="text-slate-900 hover:text-indigo-600 transition-colors dark:text-white dark:hover:text-indigo-400"
                href="https://github.com/jeetupal31"
                rel="noreferrer"
                target="_blank"
              >
                @JEETUPAL31
              </a>
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
