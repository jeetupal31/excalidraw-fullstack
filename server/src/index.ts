import express from "express";
import cors from "cors";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";

const app = express();
app.use(cors());

const server = createServer(app);
const wss = new WebSocketServer({ server });

const rooms = new Map<string, Set<WebSocket>>();

wss.on("connection", (socket, request) => {
  const url = new URL(request.url ?? "", "http://localhost");
  const roomId = url.searchParams.get("room") || "default";

  if (!rooms.has(roomId)) {
    rooms.set(roomId, new Set());
  }

  const room = rooms.get(roomId)!;
  room.add(socket);

  console.log(`Client joined room: ${roomId}`);

  socket.on("message", (msg) => {
    const message = msg.toString();

    room.forEach((client) => {
      if (client !== socket && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

  socket.on("close", () => {
    room.delete(socket);

    if (room.size === 0) {
      rooms.delete(roomId);
    }

    console.log(`Client left room: ${roomId}`);
  });
});

server.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});