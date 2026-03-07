import { Excalidraw } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import { useEffect, useRef } from "react";

function App() {
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const socket = new WebSocket("ws://localhost:3000");

    socket.onopen = () => {
      console.log("WebSocket connected");
    };

    socket.onmessage = (event) => {
      console.log("Message from server:", event.data);
    };

    socketRef.current = socket;

    return () => {
      socket.close();
    };
  }, []);

  const handleChange = (elements: readonly any[]) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(elements));
    }
  };

  return (
    <div style={{ height: "100vh", width: "100vw" }}>
      <Excalidraw onChange={handleChange} />
    </div>
  );
}

export default App;