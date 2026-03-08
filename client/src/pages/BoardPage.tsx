import { Excalidraw } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import { useCallback, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { BoardToolbar } from "../components/BoardToolbar";
import { CursorLayer } from "../components/CursorLayer";
import { PresencePanel } from "../components/PresencePanel";
import { useRoom } from "../hooks/useRoom";
import { exportBoardAsJson, exportBoardAsPng } from "../services/exportService";
import { isValidBoardId, normalizeBoardId } from "../services/board";

export function BoardPage() {
  const { boardId: rawBoardId = "" } = useParams();
  const boardId = normalizeBoardId(rawBoardId);
  const isBoardIdValid = isValidBoardId(boardId);

  const [excalidrawApi, setExcalidrawApi] = useState<ExcalidrawImperativeAPI | null>(null);
  const [isExportingPng, setIsExportingPng] = useState(false);
  const [isExportingJson, setIsExportingJson] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const {
    users,
    remoteCursors,
    registerExcalidrawApi,
    handleSceneChange,
    handlePointerMove,
    handlePointerLeave,
    connectionStatus,
    connectionError,
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
      <div className="flex h-full items-center justify-center px-6">
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

  return (
    <main
      className="relative h-full w-full overflow-hidden"
      onPointerLeave={handlePointerLeave}
      onPointerMove={handlePointerMove}
    >
      <Excalidraw
        excalidrawAPI={registerBoardApi}
        isCollaborating
        onChange={handleSceneChange}
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
      />

      {connectionStatus === "connecting" ? (
        <div className="pointer-events-none absolute bottom-4 left-4 z-20 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
          Establishing realtime connection...
        </div>
      ) : null}

      {connectionError ? (
        <div className="pointer-events-none absolute bottom-4 left-4 z-20 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-800">
          {connectionError}
        </div>
      ) : null}

      {exportError ? (
        <div className="pointer-events-none absolute bottom-4 right-4 z-20 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-800">
          {exportError}
        </div>
      ) : null}
    </main>
  );
}
