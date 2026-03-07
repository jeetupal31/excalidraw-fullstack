import { useCallback, useEffect, useRef } from "react";

interface UseWebSocketOptions<TMessage> {
  url: string;
  parseMessage: (raw: string) => TMessage | null;
  onOpen?: (socket: WebSocket) => void;
  onMessage?: (message: TMessage) => void;
  onClose?: () => void;
}

export function useWebSocket<TMessage>({
  url,
  parseMessage,
  onOpen,
  onMessage,
  onClose,
}: UseWebSocketOptions<TMessage>) {
  const socketRef = useRef<WebSocket | null>(null);

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
    const socket = new WebSocket(url);
    socketRef.current = socket;

    socket.onopen = () => {
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

    socket.onclose = () => {
      handlersRef.current.onClose?.();
    };

    return () => {
      socket.close();
      socketRef.current = null;
    };
  }, [url]);

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
  };
}
