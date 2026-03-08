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

export type ConnectionStatus = "connecting" | "open" | "closed" | "error";

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

    setConnectionStatus("connecting");
    setConnectionError(null);

    const socket = new WebSocket(url);
    socketRef.current = socket;

    socket.onopen = () => {
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
      setConnectionStatus("error");
      setConnectionError("Connection to collaboration server failed.");
    };

    socket.onclose = () => {
      setConnectionStatus((previousStatus) => {
        if (previousStatus === "error") {
          return "error";
        }

        return "closed";
      });
      handlersRef.current.onClose?.();
    };

    return () => {
      socket.close();
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
