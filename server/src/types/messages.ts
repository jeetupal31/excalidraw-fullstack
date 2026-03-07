export type SceneElements = unknown;

export interface CursorPayload {
  x: number;
  y: number;
  name: string;
  color: string;
}

export interface JoinMessage {
  type: "join";
  clientId: string;
  username: string;
}

export interface SceneUpdateMessage {
  type: "scene-update";
  elements: SceneElements;
}

export interface CursorMessage {
  type: "cursor";
  clientId: string;
  cursor: CursorPayload;
}

export interface CursorRemoveMessage {
  type: "cursor-remove";
  clientId: string;
}

export type ClientMessage =
  | JoinMessage
  | SceneUpdateMessage
  | CursorMessage
  | CursorRemoveMessage;

export interface UsersMessage {
  type: "users";
  users: Record<string, string>;
}

export type ServerMessage =
  | SceneUpdateMessage
  | CursorMessage
  | CursorRemoveMessage
  | UsersMessage;
