const BOARD_ID_CHARSET = "abcdefghijklmnopqrstuvwxyz0123456789";
const BOARD_ID_PATTERN = /^[a-z0-9-]{3,64}$/i;
const DEFAULT_BOARD_ID_LENGTH = 6;

function getRandomIndex(max: number): number {
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const buffer = new Uint32Array(1);
    crypto.getRandomValues(buffer);
    return buffer[0] % max;
  }

  return Math.floor(Math.random() * max);
}

export function generateBoardId(length = DEFAULT_BOARD_ID_LENGTH): string {
  let boardId = "";

  for (let index = 0; index < length; index += 1) {
    boardId += BOARD_ID_CHARSET[getRandomIndex(BOARD_ID_CHARSET.length)];
  }

  return boardId;
}

export function normalizeBoardId(rawBoardId: string): string {
  return rawBoardId.trim().replace(/^\/+/, "").replace(/^board\//i, "").toLowerCase();
}

export function isValidBoardId(boardId: string): boolean {
  return BOARD_ID_PATTERN.test(boardId);
}
