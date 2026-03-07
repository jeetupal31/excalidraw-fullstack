import "dotenv/config";
import express from "express";
import cors from "cors";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set");
}

const pool = new Pool({
  connectionString: databaseUrl,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const app = express();
app.use(cors());

const server = createServer(app);
const wss = new WebSocketServer({ server });

const rooms = new Map<string, Set<WebSocket>>();

wss.on("connection", async (socket, request) => {
  const url = new URL(request.url ?? "", "http://localhost");
  const roomId = url.searchParams.get("room") || "default";

  if (!rooms.has(roomId)) {
    rooms.set(roomId, new Set());
  }

  const room = rooms.get(roomId)!;
  room.add(socket);

  console.log(`Client joined room: ${roomId}`);

  try {
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
  } catch (err) {
    console.error("Load board error:", err);
  }

  socket.on("message", async (msg) => {
    const message = msg.toString();

    let payload: any;

    try {
      payload = JSON.parse(message);
    } catch {
      return;
    }

    if (payload.type === "scene-update") {
      try {
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
      } catch (err) {
        console.error("Save board error:", err);
      }
    }

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

const shutdown = async () => {
  await prisma.$disconnect();
  await pool.end();
};

process.on("SIGINT", () => {
  void shutdown().finally(() => process.exit(0));
});

process.on("SIGTERM", () => {
  void shutdown().finally(() => process.exit(0));
});
