import "dotenv/config";
import cors from "cors";
import express from "express";
import { createServer } from "http";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { WebSocketServer } from "ws";
import { healthController } from "./controllers/healthController";
import { createAuthController } from "./controllers/authController";
import { createBoardController } from "./controllers/boardController";
import { createAiController } from "./controllers/aiController";
import { RoomManager } from "./rooms/RoomManager";
import { DatabaseService } from "./services/DatabaseService";
import { AuthService } from "./services/authService";
import { createAuthMiddleware, requireAuth } from "./middleware/authMiddleware";
import { WebSocketHandler } from "./websocket/WebSocketHandler";

const port = Number(process.env.PORT ?? 3000);
const corsOrigins = process.env.CORS_ORIGINS?.split(",").map(o => o.trim()) ?? [
  "http://localhost:5173",
  "https://excalidraw-fullstack.vercel.app",
  "https://excalidraw-fullstack.onrender.com",
  "https://excalidraw-fullstack-r8w4patgh-jeetu-pals-projects.vercel.app"
];

const app = express();
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      const isAllowed = 
        corsOrigins.includes(origin) || 
        origin.endsWith(".vercel.app") || 
        origin.includes("localhost") ||
        origin.includes("127.0.0.1");

      if (isAllowed) {
        callback(null, true);
      } else {
        console.warn(`CORS blocked for origin: ${origin}`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);
app.use(express.json());
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
const authService = new AuthService(prisma);
const roomManager = new RoomManager();
const webSocketHandler = new WebSocketHandler(roomManager, databaseService, authService);

// Auth middleware — attaches req.user if valid JWT is present
app.use(createAuthMiddleware(authService));

// Auth routes
const authController = createAuthController(authService);
app.post("/api/auth/signup", authController.signup);
app.post("/api/auth/login", authController.login);
app.get("/api/auth/me", requireAuth, authController.me);

// Board routes
const boardController = createBoardController(databaseService);
app.get("/api/boards", requireAuth, boardController.getUserBoards);
app.patch("/api/boards/:id", requireAuth, boardController.renameBoard);
app.delete("/api/boards/:id", requireAuth, boardController.deleteBoard);
app.get("/api/boards/:id/versions", requireAuth, boardController.getVersions);
app.post("/api/boards/:id/versions", requireAuth, boardController.saveVersion);
app.post("/api/boards/:id/restore", requireAuth, boardController.restoreVersion);

// AI routes — protected by a lightweight in-memory rate limiter so the shared
// Groq quota can't be drained by abuse. Guests can use it (no auth required).
const aiBuckets = new Map<string, { count: number; windowStart: number }>();
const AI_WINDOW_MS = 5 * 60 * 1000;
const AI_MAX_REQUESTS = 20;
const aiRateLimit = (req: express.Request, res: express.Response, next: express.NextFunction): void => {
  const ip = req.ip ?? req.socket.remoteAddress ?? "unknown";
  const now = Date.now();
  const bucket = aiBuckets.get(ip);
  if (!bucket || now - bucket.windowStart > AI_WINDOW_MS) {
    aiBuckets.set(ip, { count: 1, windowStart: now });
    next();
    return;
  }
  bucket.count += 1;
  if (bucket.count > AI_MAX_REQUESTS) {
    res.status(429).json({ error: "Too many AI requests. Please wait a few minutes." });
    return;
  }
  next();
};
const aiSweepTimer = setInterval(() => {
  const now = Date.now();
  for (const [ip, bucket] of aiBuckets) {
    if (now - bucket.windowStart > AI_WINDOW_MS) {
      aiBuckets.delete(ip);
    }
  }
}, AI_WINDOW_MS);
aiSweepTimer.unref?.();

const aiController = createAiController();
app.post("/api/ai/generate", aiRateLimit, aiController.generate);

wss.on("connection", (socket, request) => {
  void webSocketHandler.handleConnection(socket, request);
});

server.listen(port, () => {
  console.log(`Collaboration server listening on port ${port}`);
  console.log(`Local: http://localhost:${port}`);
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
