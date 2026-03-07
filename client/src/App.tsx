import {
  CaptureUpdateAction,
  Excalidraw,
  getSceneVersion,
} from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import { useCallback, useEffect, useRef, useState } from "react";
import type {
  ExcalidrawImperativeAPI,
  OrderedExcalidrawElement,
} from "@excalidraw/excalidraw/types";

const roomId = "room1";
const WS_URL = `ws://localhost:3000?room=${roomId}`;

function randomColor() {
  return `hsl(${Math.random() * 360},70%,50%)`;
}

function App() {
  const wsRef = useRef<WebSocket | null>(null);
  const excalidrawAPIRef = useRef<ExcalidrawImperativeAPI | null>(null);

  const clientId = useRef(Math.random().toString(36).slice(2));
  const username = useRef(`User-${Math.floor(Math.random() * 1000)}`);
  const color = useRef(randomColor());

  const [remoteCursors, setRemoteCursors] = useState<
    Record<string, { x: number; y: number; name: string; color: string }>
  >({});

  const pendingRemoteElementsRef = useRef<
    readonly OrderedExcalidrawElement[] | null
  >(null);

  const isApplyingRemoteUpdateRef = useRef(false);
  const lastRemoteSceneVersionRef = useRef<number | null>(null);
  const lastSentSceneVersionRef = useRef<number>(0);

  const applyRemoteElements = useCallback(
    (elements: readonly OrderedExcalidrawElement[]) => {
      const api = excalidrawAPIRef.current;

      if (!api) {
        pendingRemoteElementsRef.current = elements;
        return;
      }

      const incomingSceneVersion = getSceneVersion(elements);
      const localSceneVersion = getSceneVersion(
        api.getSceneElementsIncludingDeleted()
      );

      if (incomingSceneVersion === localSceneVersion) return;

      isApplyingRemoteUpdateRef.current = true;
      lastRemoteSceneVersionRef.current = incomingSceneVersion;

      api.updateScene({
        elements,
        captureUpdate: CaptureUpdateAction.NEVER,
      });

      queueMicrotask(() => {
        isApplyingRemoteUpdateRef.current = false;
      });
    },
    []
  );

  const handleExcalidrawAPI = useCallback(
    (api: ExcalidrawImperativeAPI) => {
      excalidrawAPIRef.current = api;

      if (pendingRemoteElementsRef.current) {
        const pending = pendingRemoteElementsRef.current;
        pendingRemoteElementsRef.current = null;
        applyRemoteElements(pending);
      }
    },
    [applyRemoteElements]
  );

  useEffect(() => {
    const socket = new WebSocket(WS_URL);
    wsRef.current = socket;

    socket.onopen = () => {
      console.log("WS connected");
    };

    socket.onmessage = (event) => {
      const payload = JSON.parse(event.data);

      if (payload.type === "scene-update") {
        applyRemoteElements(payload.elements);
      }

      if (payload.type === "cursor") {
        setRemoteCursors((prev) => ({
          ...prev,
          [payload.clientId]: payload.cursor,
        }));
      }

      if (payload.type === "cursor-remove") {
        setRemoteCursors((prev) => {
          const copy = { ...prev };
          delete copy[payload.clientId];
          return copy;
        });
      }
    };

    return () => socket.close();
  }, [applyRemoteElements]);

  const handleChange = useCallback(
    (elements: readonly OrderedExcalidrawElement[]) => {
      const sceneVersion = getSceneVersion(elements);

      if (
        isApplyingRemoteUpdateRef.current ||
        sceneVersion === lastRemoteSceneVersionRef.current
      ) {
        lastRemoteSceneVersionRef.current = null;
        lastSentSceneVersionRef.current = sceneVersion;
        return;
      }

      if (sceneVersion === lastSentSceneVersionRef.current) return;

      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: "scene-update",
            elements,
          })
        );

        lastSentSceneVersionRef.current = sceneVersion;
      }
    },
    []
  );

  const handlePointerMove = (event: React.PointerEvent) => {
    wsRef.current?.send(
      JSON.stringify({
        type: "cursor",
        clientId: clientId.current,
        cursor: {
          x: event.clientX,
          y: event.clientY,
          name: username.current,
          color: color.current,
        },
      })
    );
  };

  const handlePointerLeave = () => {
    wsRef.current?.send(
      JSON.stringify({
        type: "cursor-remove",
        clientId: clientId.current,
      })
    );
  };

  return (
    <div
      style={{ height: "100vh", width: "100vw" }}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <Excalidraw excalidrawAPI={handleExcalidrawAPI} onChange={handleChange} />

      {Object.entries(remoteCursors).map(([id, cursor]) => (
        <div
          key={id}
          style={{
            position: "absolute",
            left: cursor.x,
            top: cursor.y,
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              width: 10,
              height: 10,
              background: cursor.color,
              borderRadius: "50%",
            }}
          />
          <div
            style={{
              background: cursor.color,
              color: "white",
              fontSize: 12,
              padding: "2px 6px",
              borderRadius: 4,
              marginTop: 2,
              whiteSpace: "nowrap",
            }}
          >
            {cursor.name}
          </div>
        </div>
      ))}
    </div>
  );
}

export default App;