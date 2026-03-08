import type {
  CursorPosition,
  SceneElements,
  SceneFiles,
  ServerMessage,
} from "../types/collaboration";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isCursor(value: unknown): value is CursorPosition {
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

function isUsersRecord(value: unknown): value is Record<string, string> {
  if (!isObject(value)) {
    return false;
  }

  return Object.values(value).every((name) => typeof name === "string");
}

export function parseServerMessage(rawData: unknown): ServerMessage | null {
  if (!isObject(rawData) || typeof rawData.type !== "string") {
    return null;
  }

  switch (rawData.type) {
    case "scene-update":
      if (!Array.isArray(rawData.elements)) {
        return null;
      }

      return {
        type: "scene-update",
        elements: rawData.elements as SceneElements,
        files: isObject(rawData.files) ? (rawData.files as SceneFiles) : undefined,
      };
    case "cursor":
      if (typeof rawData.clientId !== "string" || !isCursor(rawData.cursor)) {
        return null;
      }

      return {
        type: "cursor",
        clientId: rawData.clientId,
        cursor: rawData.cursor,
      };
    case "cursor-remove":
      if (typeof rawData.clientId !== "string") {
        return null;
      }

      return {
        type: "cursor-remove",
        clientId: rawData.clientId,
      };
    case "users":
      if (!isUsersRecord(rawData.users)) {
        return null;
      }

      return {
        type: "users",
        users: rawData.users,
      };
    default:
      return null;
  }
}
