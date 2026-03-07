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
  ServerMessage,
} from "../types/collaboration";
import { parseServerMessage } from "../services/socketProtocol";
import { createClientIdentity } from "../utils/identity";
import { useWebSocket } from "./useWebSocket";

interface UseRoomResult {
  users: PresenceUsers;
  remoteCursors: RemoteCursors;
  registerExcalidrawApi: (api: ExcalidrawImperativeAPI) => void;
  handleSceneChange: (elements: readonly ExcalidrawElement[]) => void;
  handlePointerMove: (event: PointerEvent<HTMLDivElement>) => void;
  handlePointerLeave: () => void;
}

const DEFAULT_WS_BASE_URL = "ws://localhost:3000";

export function useRoom(roomId: string): UseRoomResult {
  const identityRef = useRef(createClientIdentity());
  const excalidrawApiRef = useRef<ExcalidrawImperativeAPI | null>(null);

  const [users, setUsers] = useState<PresenceUsers>({});
  const [remoteCursors, setRemoteCursors] = useState<RemoteCursors>({});

  const pendingRemoteElementsRef = useRef<SceneElements | null>(null);
  const isApplyingRemoteUpdateRef = useRef(false);
  const lastRemoteSceneVersionRef = useRef<number | null>(null);
  const lastSentSceneVersionRef = useRef(0);

  const socketUrl = useMemo(() => {
    const wsBaseUrl = import.meta.env.VITE_WS_BASE_URL ?? DEFAULT_WS_BASE_URL;
    return `${wsBaseUrl}?room=${encodeURIComponent(roomId)}`;
  }, [roomId]);

  const applyRemoteElements = useCallback((elements: SceneElements) => {
    const api = excalidrawApiRef.current;

    if (!api) {
      pendingRemoteElementsRef.current = elements;
      return;
    }

    const incomingSceneVersion = getSceneVersion(elements);
    const localSceneVersion = getSceneVersion(api.getSceneElementsIncludingDeleted());

    if (incomingSceneVersion === localSceneVersion) {
      return;
    }

    // Guard prevents an incoming patch from triggering an outbound broadcast loop.
    isApplyingRemoteUpdateRef.current = true;
    lastRemoteSceneVersionRef.current = incomingSceneVersion;

    api.updateScene({
      elements,
      captureUpdate: CaptureUpdateAction.NEVER,
    });

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

      const pendingElements = pendingRemoteElementsRef.current;
      pendingRemoteElementsRef.current = null;
      applyRemoteElements(pendingElements);
    },
    [applyRemoteElements]
  );

  const handleServerMessage = useCallback(
    (message: ServerMessage) => {
      switch (message.type) {
        case "scene-update":
          applyRemoteElements(message.elements);
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
    [applyRemoteElements]
  );

  const parseSocketMessage = useCallback((rawMessage: string): ServerMessage | null => {
    try {
      const parsed = JSON.parse(rawMessage) as unknown;
      return parseServerMessage(parsed);
    } catch {
      return null;
    }
  }, []);

  const { sendJsonMessage } = useWebSocket<ServerMessage>({
    url: socketUrl,
    parseMessage: parseSocketMessage,
    onOpen: (socket) => {
      const joinPayload: ClientMessage = {
        type: "join",
        clientId: identityRef.current.clientId,
        username: identityRef.current.username,
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

      // Only meaningful scene deltas are emitted, cutting unnecessary websocket traffic.
      sendJsonMessage({
        type: "scene-update",
        elements,
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
    registerExcalidrawApi,
    handleSceneChange,
    handlePointerMove,
    handlePointerLeave,
  };
}
