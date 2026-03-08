import { CaptureUpdateAction, getSceneVersion } from "@excalidraw/excalidraw";
import { useCallback, useMemo, useRef, useState } from "react";
import type { PointerEvent } from "react";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import type {
  ClientMessage,
  RemoteCursors,
  PresenceUsers,
  SceneElements,
  SceneFiles,
  ServerMessage,
} from "../types/collaboration";
import { parseServerMessage } from "../services/socketProtocol";
import { createClientIdentity } from "../utils/identity";
import { useAuth } from "../contexts/AuthContext";
import { useWebSocket, type ConnectionStatus } from "./useWebSocket";

interface UseRoomResult {
  users: PresenceUsers;
  remoteCursors: RemoteCursors;
  connectionStatus: ConnectionStatus;
  connectionError: string | null;
  registerExcalidrawApi: (api: ExcalidrawImperativeAPI) => void;
  handleSceneChange: (elements: readonly ExcalidrawElement[]) => void;
  handlePointerMove: (event: PointerEvent<HTMLDivElement>) => void;
  handlePointerLeave: () => void;
  isViewer: boolean;
}

const DEFAULT_WS_BASE_URL = "wss://excalidraw-fullstack.onrender.com";

export function useRoom(roomId: string, enabled = true): UseRoomResult {
  const { user, token } = useAuth();
  const identityRef = useRef(createClientIdentity());
  const excalidrawApiRef = useRef<ExcalidrawImperativeAPI | null>(null);

  const [users, setUsers] = useState<PresenceUsers>({});
  const [remoteCursors, setRemoteCursors] = useState<RemoteCursors>({});

  const pendingRemoteElementsRef = useRef<{ elements: SceneElements; files?: SceneFiles } | null>(null);
  const isApplyingRemoteUpdateRef = useRef(false);
  const lastRemoteSceneVersionRef = useRef<number | null>(null);
  const lastSentSceneVersionRef = useRef(0);

  const socketUrl = useMemo(() => {
    let wsBaseUrl = import.meta.env.VITE_WS_BASE_URL ?? DEFAULT_WS_BASE_URL;

    // Auto-fix protocol for production (https -> wss)
    if (window.location.protocol === "https:") {
      wsBaseUrl = wsBaseUrl.replace("ws://", "wss://");
    }

    let url = `${wsBaseUrl}?room=${encodeURIComponent(roomId)}`;
    if (token) {
      url += `&token=${encodeURIComponent(token)}`;
    }
    
    // Pass along viewer role if present in the browser URL
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get("role") === "viewer") {
      url += `&role=viewer`;
    }
    
    return url;
  }, [roomId, token]);
  
  const isViewer = useMemo(() => {
    return new URLSearchParams(window.location.search).get("role") === "viewer";
  }, []);

  const applyRemoteUpdate = useCallback((elements: SceneElements, files?: SceneFiles) => {
    const api = excalidrawApiRef.current;

    if (!api) {
      pendingRemoteElementsRef.current = { elements, files };
      return;
    }

    const incomingSceneVersion = getSceneVersion(elements);
    const localSceneVersion = getSceneVersion(api.getSceneElementsIncludingDeleted());

    if (incomingSceneVersion === localSceneVersion && !files) {
      return;
    }

    // Guard prevents an incoming patch from triggering an outbound broadcast loop.
    isApplyingRemoteUpdateRef.current = true;
    lastRemoteSceneVersionRef.current = incomingSceneVersion;

    api.updateScene({
      elements,
      captureUpdate: CaptureUpdateAction.NEVER,
    });

    // Apply binary file data (images) if present
    if (files && Object.keys(files).length > 0) {
      const fileArray = Object.values(files);
      if (fileArray.length > 0) {
        api.addFiles(fileArray);
      }
    }

    queueMicrotask(() => {
      isApplyingRemoteUpdateRef.current = false;
    });
  }, []);

  const registerExcalidrawApi = useCallback(
    (api: ExcalidrawImperativeAPI) => {
      excalidrawApiRef.current = api;

      if (!pendingRemoteElementsRef.current) {
        return;
      }

      const { elements, files } = pendingRemoteElementsRef.current;
      pendingRemoteElementsRef.current = null;
      applyRemoteUpdate(elements, files);
    },
    [applyRemoteUpdate]
  );

  const handleServerMessage = useCallback(
    (message: ServerMessage) => {
      switch (message.type) {
        case "scene-update":
          applyRemoteUpdate(message.elements, message.files);
          break;
        case "cursor":
          setRemoteCursors((previousCursors) => ({
            ...previousCursors,
            [message.clientId]: message.cursor,
          }));
          break;
        case "cursor-remove":
          setRemoteCursors((previousCursors) => {
            const nextCursors = { ...previousCursors };
            delete nextCursors[message.clientId];
            return nextCursors;
          });
          break;
        case "users":
          setUsers(message.users);
          break;
        default:
          break;
      }
    },
    [applyRemoteUpdate]
  );

  const parseSocketMessage = useCallback((rawMessage: string): ServerMessage | null => {
    try {
      const parsed = JSON.parse(rawMessage) as unknown;
      return parseServerMessage(parsed);
    } catch {
      return null;
    }
  }, []);

  const { sendJsonMessage, connectionStatus, connectionError } = useWebSocket<ServerMessage>({
    url: socketUrl,
    enabled,
    parseMessage: parseSocketMessage,
    onOpen: (socket) => {
      const joinPayload: ClientMessage = {
        type: "join",
        clientId: identityRef.current.clientId,
        username: user?.username ?? identityRef.current.username,
      };

      socket.send(JSON.stringify(joinPayload));
    },
    onMessage: handleServerMessage,
    onClose: () => {
      setRemoteCursors({});
      setUsers({});
    },
  });

  const handleSceneChange = useCallback(
    (elements: readonly ExcalidrawElement[]) => {
      const sceneVersion = getSceneVersion(elements);

      if (
        isApplyingRemoteUpdateRef.current ||
        sceneVersion === lastRemoteSceneVersionRef.current
      ) {
        lastRemoteSceneVersionRef.current = null;
        lastSentSceneVersionRef.current = sceneVersion;
        return;
      }

      if (sceneVersion === lastSentSceneVersionRef.current) {
        return;
      }

      // Collect binary file data (images) from the Excalidraw API
      const api = excalidrawApiRef.current;
      const files = api ? api.getFiles() : undefined;

      // Only meaningful scene deltas are emitted, cutting unnecessary websocket traffic.
      sendJsonMessage({
        type: "scene-update",
        elements,
        files: files && Object.keys(files).length > 0 ? files : undefined,
      } satisfies ClientMessage);

      lastSentSceneVersionRef.current = sceneVersion;
    },
    [sendJsonMessage]
  );

  const handlePointerMove = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      sendJsonMessage({
        type: "cursor",
        clientId: identityRef.current.clientId,
        cursor: {
          x: event.clientX,
          y: event.clientY,
          name: identityRef.current.username,
          color: identityRef.current.color,
        },
      } satisfies ClientMessage);
    },
    [sendJsonMessage]
  );

  const handlePointerLeave = useCallback(() => {
    sendJsonMessage({
      type: "cursor-remove",
      clientId: identityRef.current.clientId,
    } satisfies ClientMessage);
  }, [sendJsonMessage]);

  return {
    users,
    remoteCursors,
    connectionStatus,
    connectionError,
    registerExcalidrawApi,
    handleSceneChange,
    handlePointerMove,
    handlePointerLeave,
    isViewer,
  };
}
