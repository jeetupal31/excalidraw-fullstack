import { WebSocket } from "ws";

type ConnectionMeta = {
  roomId: string;
  clientId?: string;
};

export class RoomManager {
  private readonly rooms = new Map<string, Set<WebSocket>>();
  private readonly roomUsers = new Map<string, Map<string, string>>();
  private readonly connectionMeta = new Map<WebSocket, ConnectionMeta>();

  addSocketToRoom(roomId: string, socket: WebSocket): void {
    const roomSockets = this.rooms.get(roomId) ?? new Set<WebSocket>();
    roomSockets.add(socket);

    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, roomSockets);
    }

    if (!this.roomUsers.has(roomId)) {
      this.roomUsers.set(roomId, new Map<string, string>());
    }

    this.connectionMeta.set(socket, { roomId });
  }

  registerUser(socket: WebSocket, clientId: string, username: string): { roomId: string } | null {
    const meta = this.connectionMeta.get(socket);
    if (!meta) {
      return null;
    }

    meta.clientId = clientId;

    const users = this.roomUsers.get(meta.roomId);
    if (!users) {
      return null;
    }

    users.set(clientId, username);
    return { roomId: meta.roomId };
  }

  getUsers(roomId: string): Record<string, string> {
    const users = this.roomUsers.get(roomId);
    if (!users) {
      return {};
    }

    return Object.fromEntries(users.entries());
  }

  getRoomId(socket: WebSocket): string | null {
    return this.connectionMeta.get(socket)?.roomId ?? null;
  }

  broadcast(roomId: string, message: string, sender?: WebSocket): void {
    const room = this.rooms.get(roomId);
    if (!room) {
      return;
    }

    // Broadcast only to open sockets in this room to avoid write errors on stale connections.
    room.forEach((clientSocket) => {
      if (clientSocket === sender) {
        return;
      }

      if (clientSocket.readyState === WebSocket.OPEN) {
        clientSocket.send(message);
      }
    });
  }

  removeSocket(socket: WebSocket): { roomId: string; clientId?: string } | null {
    const meta = this.connectionMeta.get(socket);
    if (!meta) {
      return null;
    }

    const roomSockets = this.rooms.get(meta.roomId);
    roomSockets?.delete(socket);

    const users = this.roomUsers.get(meta.roomId);
    if (meta.clientId && users?.has(meta.clientId)) {
      users.delete(meta.clientId);
    }

    this.connectionMeta.delete(socket);

    if (roomSockets && roomSockets.size === 0) {
      this.rooms.delete(meta.roomId);
      this.roomUsers.delete(meta.roomId);
    }

    return { roomId: meta.roomId, clientId: meta.clientId };
  }
}
