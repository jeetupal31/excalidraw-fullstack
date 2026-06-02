import { useCallback, useEffect, useRef } from "react";
import { useState } from "react";

interface UseWebSocketOptions<TMessage> {
  url: string;
  enabled?: boolean;
  parseMessage: (raw: string) => TMessage | null;
  onOpen?: (socket: WebSocket) => void;
  onMessage?: (message: TMessage) => void;
  onClose?: () => void;
}

export type ConnectionStatus = "connecting" | "open" | "closed" | "error" | "reconnecting";

const INITIAL_RECONNECT_DELAY_MS = 1000;
const MAX_RECONNECT_DELAY_MS = 15000;

export function useWebSocket<TMessage>({
  url,
  enabled = true,
  parseMessage,
  onOpen,
  onMessage,
  onClose,
}: UseWebSocketOptions<TMessage>) {
  const socketRef = useRef<WebSocket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("connecting");
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const handlersRef = useRef({
    parseMessage,
    onOpen,
    onMessage,
    onClose,
  });

  // Reconnection bookkeeping (kept in refs so it survives re-renders).
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    handlersRef.current = {
      parseMessage,
      onOpen,
      onMessage,
      onClose,
    };
  }, [parseMessage, onOpen, onMessage, onClose]);

  useEffect(() => {
    if (!enabled) {
      socketRef.current = null;
      setConnectionStatus("closed");
      setConnectionError(null);
      return;
    }

    // `active` flips to false on cleanup (unmount / url change / disable) so a
    // late close event from an old socket can't trigger a reconnect.
    let active = true;

    const clearReconnectTimer = () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };

    const connect = () => {
      if (!active) {
        return;
      }

      // First attempt shows "connecting"; subsequent ones show "reconnecting".
      setConnectionStatus(reconnectAttemptsRef.current === 0 ? "connecting" : "reconnecting");
      setConnectionError(null);

      const socket = new WebSocket(url);
      socketRef.current = socket;

      socket.onopen = () => {
        if (!active) {
          return;
        }
        reconnectAttemptsRef.current = 0;
        setConnectionStatus("open");
        setConnectionError(null);
        handlersRef.current.onOpen?.(socket);
      };

      socket.onmessage = (event) => {
        if (typeof event.data !== "string") {
          return;
        }
        const parsed = handlersRef.current.parseMessage(event.data);
        if (parsed) {
          handlersRef.current.onMessage?.(parsed);
        }
      };

      socket.onerror = () => {
        if (!active) {
          return;
        }
        setConnectionError("Connection to collaboration server failed.");
      };

      socket.onclose = () => {
        if (!active) {
          return;
        }
        handlersRef.current.onClose?.();

        // Unexpected drop — retry with exponential backoff (capped).
        const attempt = reconnectAttemptsRef.current + 1;
        reconnectAttemptsRef.current = attempt;
        const delay = Math.min(
          INITIAL_RECONNECT_DELAY_MS * 2 ** (attempt - 1),
          MAX_RECONNECT_DELAY_MS
        );
        setConnectionStatus("reconnecting");
        clearReconnectTimer();
        reconnectTimerRef.current = setTimeout(connect, delay);
      };
    };

    connect();

    return () => {
      active = false;
      clearReconnectTimer();
      reconnectAttemptsRef.current = 0;
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [enabled, url]);

  const sendJsonMessage = useCallback((payload: unknown) => {
    const socket = socketRef.current;

    if (!socket || socket.readyState !== WebSocket.OPEN) {
      return;
    }

    socket.send(JSON.stringify(payload));
  }, []);

  return {
    socketRef,
    sendJsonMessage,
    connectionStatus,
    connectionError,
  };
}
