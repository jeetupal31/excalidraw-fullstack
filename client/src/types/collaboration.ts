import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";

export type SceneElements = readonly ExcalidrawElement[];

export interface CursorPosition {
  x: number;
  y: number;
  name: string;
  color: string;
}

export type PresenceUsers = Record<string, string>;
export type RemoteCursors = Record<string, CursorPosition>;

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
  cursor: CursorPosition;
}

export interface CursorRemoveMessage {
  type: "cursor-remove";
  clientId: string;
}

export interface UsersMessage {
  type: "users";
  users: PresenceUsers;
}

export type ClientMessage =
  | JoinMessage
  | SceneUpdateMessage
  | CursorMessage
  | CursorRemoveMessage;

export type ServerMessage =
  | SceneUpdateMessage
  | CursorMessage
  | CursorRemoveMessage
  | UsersMessage;
