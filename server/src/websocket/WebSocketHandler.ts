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
import type { AuthService, AuthUser } from "../services/authService";

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
  private socketRoles = new WeakMap<WebSocket, string>();

  // Debounced persistence: rapid scene-updates are broadcast instantly but
  // coalesced into at most one Postgres write per room per debounce window.
  private static readonly SAVE_DEBOUNCE_MS = 600;
  private pendingState = new Map<string, { elements: Prisma.InputJsonValue; files?: Prisma.InputJsonValue }>();
  private saveTimers = new Map<string, ReturnType<typeof setTimeout>>();

  constructor(
    private readonly roomManager: RoomManager,
    private readonly databaseService: DatabaseService,
    private readonly authService: AuthService
  ) {}

  async handleConnection(socket: WebSocket, request: IncomingMessage): Promise<void> {
    const roomId = this.resolveRoomId(request);
    const user = this.resolveUser(request);
    const requestedRole = this.resolveRequestedRole(request);
    
    // Default to editor unless they requested a viewer role specifically via URL
    const role = requestedRole === "viewer" ? "viewer" : "editor";
    this.socketRoles.set(socket, role);

    this.roomManager.addSocketToRoom(roomId, socket);
    console.log(`Client connected to room: ${roomId}${user ? ` (user: ${user.username})` : " (guest)"} as ${role}`);

    // If authenticated, auto-create board membership
    if (user && role !== "viewer") {
      try {
        const existingRole = await this.databaseService.getBoardRole(roomId, user.id);
        if (!existingRole) {
          await this.databaseService.addBoardMember(roomId, user.id, "editor");
        }
      } catch {
        // Board may not exist yet — membership will be set when the board is first saved
      }
    }

    // Flush any debounced state for this room first, so a joiner always loads
    // the latest committed scene rather than a slightly stale snapshot.
    await this.flushRoom(roomId);

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
      void this.handleMessage(roomId, socket, rawData, user);
    });

    socket.on("close", () => {
      this.socketRoles.delete(socket);
      this.handleClose(socket);
    });
  }

  private resolveRoomId(request: IncomingMessage): string {
    const url = new URL(request.url ?? "", "http://localhost");
    return url.searchParams.get("room") ?? "default";
  }

  private resolveRequestedRole(request: IncomingMessage): string | null {
    const url = new URL(request.url ?? "", "http://localhost");
    return url.searchParams.get("role");
  }

  private resolveUser(request: IncomingMessage): AuthUser | null {
    const url = new URL(request.url ?? "", "http://localhost");
    const token = url.searchParams.get("token");

    if (!token) {
      return null;
    }

    return this.authService.verifyToken(token);
  }

  private async handleMessage(
    roomId: string,
    socket: WebSocket,
    rawData: RawData,
    user: AuthUser | null
  ): Promise<void> {
    const payload = this.parseMessage(rawData.toString());
    if (!payload) {
      return;
    }
    
    const role = this.socketRoles.get(socket) ?? "viewer"; // default secure
    const isViewer = role === "viewer";

    switch (payload.type) {
      case "join":
        this.handleJoin(socket, payload.clientId, user?.username ?? payload.username);
        break;
      case "scene-update":
        this.handleSceneUpdate(roomId, socket, payload, isViewer);
        break;
      case "cursor":
      case "cursor-remove":
        // Viewers shouldn't broadcast cursors to avoid confusing editors
        if (!isViewer) {
          this.broadcastToRoom(roomId, payload, socket);
        }
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

  private handleSceneUpdate(
    roomId: string,
    socket: WebSocket,
    payload: SceneUpdateMessage,
    isViewer: boolean
  ): void {
    if (isViewer) {
      // Secretly drop updates from viewers so they cannot modify the board.
      return;
    }

    // Broadcast immediately (skipping the sender to avoid echo loops) so peers
    // see edits in real time, then debounce the Postgres write. Membership is
    // already ensured once on connect, so we no longer hit the DB per update.
    this.broadcastToRoom(roomId, payload, socket);
    this.scheduleSave(
      roomId,
      payload.elements as Prisma.InputJsonValue,
      payload.files as Prisma.InputJsonValue | undefined
    );
  }

  /** Stores the latest scene for a room and (re)arms the debounced save. */
  private scheduleSave(
    roomId: string,
    elements: Prisma.InputJsonValue,
    files?: Prisma.InputJsonValue
  ): void {
    this.pendingState.set(roomId, { elements, files });

    const existing = this.saveTimers.get(roomId);
    if (existing) {
      clearTimeout(existing);
    }

    const timer = setTimeout(() => {
      void this.flushRoom(roomId);
    }, WebSocketHandler.SAVE_DEBOUNCE_MS);
    this.saveTimers.set(roomId, timer);
  }

  /** Persists any pending scene for a room immediately (idempotent). */
  private async flushRoom(roomId: string): Promise<void> {
    const timer = this.saveTimers.get(roomId);
    if (timer) {
      clearTimeout(timer);
      this.saveTimers.delete(roomId);
    }

    const pending = this.pendingState.get(roomId);
    if (!pending) {
      return;
    }
    this.pendingState.delete(roomId);

    try {
      await this.databaseService.saveBoardState(roomId, pending.elements, pending.files);
    } catch (error) {
      console.error(`Failed to persist board state for room ${roomId}:`, error);
    }
  }

  private handleClose(socket: WebSocket): void {
    const removed = this.roomManager.removeSocket(socket);
    if (!removed) {
      return;
    }

    const { roomId, clientId } = removed;

    // Persist any pending edits now so nothing is lost when users leave.
    void this.flushRoom(roomId);

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
