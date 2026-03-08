import { Excalidraw, Sidebar } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import { useCallback, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { BoardToolbar } from "../components/BoardToolbar";
import { CursorLayer } from "../components/CursorLayer";
import { PresencePanel } from "../components/PresencePanel";
import { VersionHistory } from "../components/VersionHistory";
import { useRoom } from "../hooks/useRoom";
import { exportBoardAsJson, exportBoardAsPng } from "../services/exportService";
import { isValidBoardId, normalizeBoardId } from "../services/board";

const SIDEBAR_NAME = "board-info";

export function BoardPage() {
  const { boardId: rawBoardId = "" } = useParams();
  const boardId = normalizeBoardId(rawBoardId);
  const isBoardIdValid = isValidBoardId(boardId);

  const [excalidrawApi, setExcalidrawApi] = useState<ExcalidrawImperativeAPI | null>(null);
  const [isExportingPng, setIsExportingPng] = useState(false);
  const [isExportingJson, setIsExportingJson] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const {
    users,
    remoteCursors,
    registerExcalidrawApi,
    handleSceneChange,
    handlePointerMove,
    handlePointerLeave,
    connectionStatus,
    connectionError,
    isViewer,
  } = useRoom(isBoardIdValid ? boardId : "default", isBoardIdValid);

  const registerBoardApi = useCallback(
    (api: ExcalidrawImperativeAPI) => {
      setExcalidrawApi(api);
      registerExcalidrawApi(api);
    },
    [registerExcalidrawApi]
  );

  const handleExportPng = useCallback(async () => {
    if (!excalidrawApi) {
      setExportError("Canvas is loading. Please try again.");
      return;
    }

    setIsExportingPng(true);
    setExportError(null);

    try {
      await exportBoardAsPng(excalidrawApi, boardId);
    } catch {
      setExportError("PNG export failed. Please try again.");
    } finally {
      setIsExportingPng(false);
    }
  }, [boardId, excalidrawApi]);

  const handleExportJson = useCallback(() => {
    if (!excalidrawApi) {
      setExportError("Canvas is loading. Please try again.");
      return;
    }

    setIsExportingJson(true);
    setExportError(null);

    try {
      exportBoardAsJson(excalidrawApi, boardId);
    } catch {
      setExportError("JSON export failed. Please try again.");
    } finally {
      setIsExportingJson(false);
    }
  }, [boardId, excalidrawApi]);



  if (!isBoardIdValid) {
    return (
      <div className="flex h-full items-center justify-center px-4 sm:px-6">
        <div className="max-w-md rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center">
          <h1 className="text-lg font-semibold text-rose-800">Invalid board ID</h1>
          <p className="mt-2 text-sm leading-relaxed text-rose-700">
            Board IDs must be 3-64 characters and can include letters, numbers, and hyphens.
          </p>
          <Link
            className="mt-4 inline-flex rounded-full bg-rose-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-800"
            to="/"
          >
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  const userNames = Object.values(users);

  return (
    <main
      className="board-container relative w-full overflow-hidden"
      onPointerLeave={handlePointerLeave}
      onPointerMove={handlePointerMove}
    >
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <Excalidraw
        excalidrawAPI={registerBoardApi}
        isCollaborating
        viewModeEnabled={isViewer}
        UIOptions={{
          canvasActions: {
            toggleTheme: true,
          },
        }}
        onChange={handleSceneChange}
        {...{
          renderSidebar: () => (
            <Sidebar name={SIDEBAR_NAME}>
              <Sidebar.Header>Board Info</Sidebar.Header>
              <div style={{ padding: 16 }}>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#64748b", marginBottom: 6 }}>
                    Board ID
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", wordBreak: "break-all" }}>
                    {boardId}
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#64748b", marginBottom: 6 }}>
                    Connection
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span
                      style={{
                        display: "inline-block",
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        backgroundColor:
                          connectionStatus === "open" ? "#34d399" :
                          connectionStatus === "connecting" ? "#fbbf24" :
                          connectionStatus === "error" ? "#f87171" : "#94a3b8",
                      }}
                    />
                    <span style={{ fontSize: 13, color: "#334155" }}>
                      {connectionStatus === "open" ? "Connected" :
                       connectionStatus === "connecting" ? "Connecting..." :
                       connectionStatus === "error" ? "Error" : "Disconnected"}
                    </span>
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#64748b", marginBottom: 6 }}>
                    Active Users ({userNames.length})
                  </div>
                  {userNames.length === 0 ? (
                    <div style={{ fontSize: 13, color: "#94a3b8" }}>Waiting for collaborators...</div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      {userNames.map((name) => (
                        <div key={name} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#334155" }}>
                          <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", backgroundColor: "#34d399" }} />
                          {name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: 12, marginTop: 4 }}>
                  <Link
                    to="/"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      fontSize: 13,
                      fontWeight: 700,
                      color: "#4f46e5",
                      textDecoration: "none",
                      backgroundColor: "#f5f3ff",
                      padding: "8px 16px",
                      borderRadius: "10px",
                      transition: "all 0.2s"
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.backgroundColor = "#ede9fe"; }}
                    onMouseOut={(e) => { e.currentTarget.style.backgroundColor = "#f5f3ff"; }}
                  >
                    <ArrowLeft size={16} strokeWidth={3} />
                    Exit to Dashboard
                  </Link>
                </div>
              </div>
            </Sidebar>
          ),
        } as Record<string, unknown>}
      />

      <CursorLayer cursors={remoteCursors} />
      <PresencePanel users={users} />

      <BoardToolbar
        boardId={boardId}
        connectionStatus={connectionStatus}
        isExportingJson={isExportingJson}
        isExportingPng={isExportingPng}
        onExportJson={handleExportJson}
        onExportPng={handleExportPng}
        isViewer={isViewer}
        onToggleHistory={() => setShowHistory((prev) => !prev)}
      />

      {showHistory && (
        <div className="absolute bottom-0 right-0 top-0 z-30 w-80 border-l border-slate-200 bg-white shadow-xl transition-transform">
          <VersionHistory
            boardId={boardId}
            isViewer={isViewer}
            onClose={() => setShowHistory(false)}
            onRestore={() => {
              setShowHistory(false);
              window.location.reload(); // Refresh to pull new state from the server cleanly
            }}
          />
        </div>
      )}



      {connectionStatus === "connecting" ? (
        <div className="pointer-events-none absolute bottom-12 left-2 z-20 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 sm:left-4">
          Establishing realtime connection...
        </div>
      ) : null}

      {connectionError ? (
        <div className="pointer-events-none absolute bottom-12 left-2 z-20 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-800 sm:left-4">
          {connectionError}
        </div>
      ) : null}

      {exportError ? (
        <div className="pointer-events-none absolute bottom-4 right-2 z-20 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-800 sm:right-4">
          {exportError}
        </div>
      ) : null}
    </main>
  );
}
