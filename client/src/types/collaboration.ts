import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import type { BinaryFileData } from "@excalidraw/excalidraw/types";

export type SceneElements = readonly ExcalidrawElement[];
export type SceneFiles = Record<string, BinaryFileData>;

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
  files?: SceneFiles;
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
