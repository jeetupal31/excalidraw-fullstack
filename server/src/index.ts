import "dotenv/config";
import cors from "cors";
import express from "express";
import { createServer } from "http";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { WebSocketServer } from "ws";
import { healthController } from "./controllers/healthController";
import { RoomManager } from "./rooms/RoomManager";
import { DatabaseService } from "./services/DatabaseService";
import { WebSocketHandler } from "./websocket/WebSocketHandler";

const port = Number(process.env.PORT ?? 3000);

const app = express();
app.use(cors());
app.get("/health", healthController);

const server = createServer(app);
const wss = new WebSocketServer({ server });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("Missing DATABASE_URL. Add it to server/.env before starting the server.");
}

const adapter = new PrismaPg({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter });
const databaseService = new DatabaseService(prisma);
const roomManager = new RoomManager();
const webSocketHandler = new WebSocketHandler(roomManager, databaseService);

wss.on("connection", (socket, request) => {
  void webSocketHandler.handleConnection(socket, request);
});

server.listen(port, () => {
  console.log(`Collaboration server listening on http://localhost:${port}`);
});

const shutdown = async (): Promise<void> => {
  console.log("Shutting down server...");

  wss.close();
  server.close();
  await databaseService.disconnect();
};

process.on("SIGINT", () => {
  void shutdown().finally(() => process.exit(0));
});

process.on("SIGTERM", () => {
  void shutdown().finally(() => process.exit(0));
});
