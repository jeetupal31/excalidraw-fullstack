import "dotenv/config";
import express from "express";
import cors from "cors";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const app = express();
app.use(cors());

const server = createServer(app);
const wss = new WebSocketServer({ server });

const rooms = new Map<string, Set<WebSocket>>();
const roomUsers = new Map<string, Map<string, string>>();

wss.on("connection", async (socket, request) => {
  const url = new URL(request.url ?? "", "http://localhost");
  const roomId = url.searchParams.get("room") || "default";

  if (!rooms.has(roomId)) rooms.set(roomId, new Set());
  if (!roomUsers.has(roomId)) roomUsers.set(roomId, new Map());

  const room = rooms.get(roomId)!;
  const users = roomUsers.get(roomId)!;

  room.add(socket);

  console.log(`Client joined room: ${roomId}`);

  const board = await prisma.board.findUnique({
    where: { id: roomId },
  });

  if (board) {
    socket.send(
      JSON.stringify({
        type: "scene-update",
        elements: board.elements,
      })
    );
  }

  socket.on("message", async (msg) => {
    const message = msg.toString();

    let payload: any;

    try {
      payload = JSON.parse(message);
    } catch {
      return;
    }

    if (payload.type === "join") {
      users.set(payload.clientId, payload.username);

      room.forEach((client) => {
        client.send(
          JSON.stringify({
            type: "users",
            users: Object.fromEntries(users),
          })
        );
      });
    }

    if (payload.type === "scene-update") {
      await prisma.board.upsert({
        where: { id: roomId },
        update: {
          elements: payload.elements,
        },
        create: {
          id: roomId,
          elements: payload.elements,
        },
      });
    }

    room.forEach((client) => {
      if (client !== socket && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

  socket.on("close", () => {
    room.delete(socket);

    room.forEach((client) => {
      client.send(
        JSON.stringify({
          type: "users",
          users: Object.fromEntries(users),
        })
      );
    });

    if (room.size === 0) {
      rooms.delete(roomId);
      roomUsers.delete(roomId);
    }

    console.log(`Client left room: ${roomId}`);
  });
});

server.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});