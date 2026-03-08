import type { IncomingMessage } from "http";
import type { Prisma } from "@prisma/client";
import type { RawData, WebSocket } from "ws";
import type {
  ClientMessage,
  CursorPayload,
  CursorRemoveMessage,
  SceneUpdateMessage,
  ServerMessage,
} from "../types/messages";
import { RoomManager } from "../rooms/RoomManager";
import { DatabaseService } from "../services/DatabaseService";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isCursorPayload(value: unknown): value is CursorPayload {
  if (!isObject(value)) {
    return false;
  }

  return (
    typeof value.x === "number" &&
    typeof value.y === "number" &&
    typeof value.name === "string" &&
    typeof value.color === "string"
  );
}

function isClientMessage(value: unknown): value is ClientMessage {
  if (!isObject(value) || typeof value.type !== "string") {
    return false;
  }

  switch (value.type) {
    case "join":
      return typeof value.clientId === "string" && typeof value.username === "string";
    case "scene-update":
      return "elements" in value;
    case "cursor":
      return typeof value.clientId === "string" && isCursorPayload(value.cursor);
    case "cursor-remove":
      return typeof value.clientId === "string";
    default:
      return false;
  }
}

export class WebSocketHandler {
  constructor(
    private readonly roomManager: RoomManager,
    private readonly databaseService: DatabaseService
  ) {}

  async handleConnection(socket: WebSocket, request: IncomingMessage): Promise<void> {
    const roomId = this.resolveRoomId(request);

    this.roomManager.addSocketToRoom(roomId, socket);
    console.log(`Client connected to room: ${roomId}`);

    const boardState = await this.databaseService.loadBoardState(roomId);
    if (boardState) {
      const scenePayload: ServerMessage = {
        type: "scene-update",
        elements: boardState.elements as SceneUpdateMessage["elements"],
        files: boardState.files as SceneUpdateMessage["files"],
      };
      this.send(socket, scenePayload);
    }

    socket.on("message", (rawData) => {
      void this.handleMessage(roomId, socket, rawData);
    });

    socket.on("close", () => {
      this.handleClose(socket);
    });
  }

  private resolveRoomId(request: IncomingMessage): string {
    const url = new URL(request.url ?? "", "http://localhost");
    return url.searchParams.get("room") ?? "default";
  }

  private async handleMessage(roomId: string, socket: WebSocket, rawData: RawData): Promise<void> {
    const payload = this.parseMessage(rawData.toString());
    if (!payload) {
      return;
    }

    switch (payload.type) {
      case "join":
        this.handleJoin(socket, payload.clientId, payload.username);
        break;
      case "scene-update":
        await this.handleSceneUpdate(roomId, socket, payload);
        break;
      case "cursor":
      case "cursor-remove":
        this.broadcastToRoom(roomId, payload, socket);
        break;
      default:
        break;
    }
  }

  private handleJoin(socket: WebSocket, clientId: string, username: string): void {
    const registration = this.roomManager.registerUser(socket, clientId, username);
    if (!registration) {
      return;
    }

    this.broadcastUsers(registration.roomId);
  }

  private async handleSceneUpdate(
    roomId: string,
    socket: WebSocket,
    payload: SceneUpdateMessage
  ): Promise<void> {
    // Scene updates are persisted first so reconnecting clients always get the latest committed state.
    await this.databaseService.saveBoardState(
      roomId,
      payload.elements as Prisma.InputJsonValue,
      payload.files as Prisma.InputJsonValue | undefined
    );

    // We skip the sender to prevent echo loops while still syncing all peers in the room.
    this.broadcastToRoom(roomId, payload, socket);
  }

  private handleClose(socket: WebSocket): void {
    const removed = this.roomManager.removeSocket(socket);
    if (!removed) {
      return;
    }

    const { roomId, clientId } = removed;

    if (clientId) {
      const removePayload: CursorRemoveMessage = {
        type: "cursor-remove",
        clientId,
      };
      this.broadcastToRoom(roomId, removePayload);
    }

    // Presence is room-scoped; each disconnect triggers a fresh users payload to keep side panels accurate.
    this.broadcastUsers(roomId);
    console.log(`Client disconnected from room: ${roomId}`);
  }

  private broadcastUsers(roomId: string): void {
    this.broadcastToRoom(roomId, {
      type: "users",
      users: this.roomManager.getUsers(roomId),
    });
  }

  private broadcastToRoom(roomId: string, payload: ServerMessage, sender?: WebSocket): void {
    this.roomManager.broadcast(roomId, JSON.stringify(payload), sender);
  }

  private send(socket: WebSocket, payload: ServerMessage): void {
    socket.send(JSON.stringify(payload));
  }

  private parseMessage(rawMessage: string): ClientMessage | null {
    try {
      const parsed = JSON.parse(rawMessage) as unknown;
      return isClientMessage(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }
}
