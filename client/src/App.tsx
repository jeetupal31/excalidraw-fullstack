import {
  CaptureUpdateAction,
  Excalidraw,
  getSceneVersion,
} from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import { useCallback, useEffect, useRef } from "react";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import type { OrderedExcalidrawElement } from "@excalidraw/excalidraw/element/types";

const WS_URL = "ws://localhost:3000";

function App() {
  const wsRef = useRef<WebSocket | null>(null);
  const excalidrawAPIRef = useRef<ExcalidrawImperativeAPI | null>(null);
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
        api.getSceneElementsIncludingDeleted(),
      );
      if (incomingSceneVersion === localSceneVersion) {
        return;
      }

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
    [],
  );

  const handleExcalidrawAPI = useCallback(
    (api: ExcalidrawImperativeAPI) => {
      excalidrawAPIRef.current = api;

      if (pendingRemoteElementsRef.current) {
        const pendingElements = pendingRemoteElementsRef.current;
        pendingRemoteElementsRef.current = null;
        applyRemoteElements(pendingElements);
      }
    },
    [applyRemoteElements],
  );

  useEffect(() => {
    const socket = new WebSocket(WS_URL);
    wsRef.current = socket;

    socket.onopen = () => {
      console.log("WS connected");
    };

    socket.onmessage = (event) => {
      if (typeof event.data !== "string") {
        return;
      }

      try {
        const elements = JSON.parse(event.data) as OrderedExcalidrawElement[];
        if (Array.isArray(elements)) {
          applyRemoteElements(elements);
        }
      } catch (error) {
        console.error("Invalid WS payload:", error);
      }
    };

    socket.onclose = () => {
      if (wsRef.current === socket) {
        wsRef.current = null;
      }
    };

    return () => {
      socket.close();
      if (wsRef.current === socket) {
        wsRef.current = null;
      }
    };
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

      if (sceneVersion === lastSentSceneVersionRef.current) {
        return;
      }

      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify(elements));
        lastSentSceneVersionRef.current = sceneVersion;
      }
    },
    [],
  );

  return (
    <div style={{ height: "100vh", width: "100vw" }}>
      <Excalidraw excalidrawAPI={handleExcalidrawAPI} onChange={handleChange} />
    </div>
  );
}

export default App;
