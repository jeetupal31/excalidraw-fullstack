import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { generateBoardId, isValidBoardId, normalizeBoardId } from "../services/board";

interface JoinBoardResult {
  success: boolean;
  boardId?: string;
  error?: string;
}

export function useBoardNavigation() {
  const navigate = useNavigate();

  const createBoard = useCallback(() => {
    const boardId = generateBoardId();
    navigate(`/board/${boardId}`);
    return boardId;
  }, [navigate]);

  const joinBoard = useCallback(
    (rawBoardId: string): JoinBoardResult => {
      const boardId = normalizeBoardId(rawBoardId);

      if (!boardId) {
        return {
          success: false,
          error: "Enter a board ID before joining.",
        };
      }

      if (!isValidBoardId(boardId)) {
        return {
          success: false,
          error: "Board ID must be 3-64 characters: letters, numbers, or hyphens.",
        };
      }

      navigate(`/board/${boardId}`);

      return {
        success: true,
        boardId,
      };
    },
    [navigate]
  );

  return {
    createBoard,
    joinBoard,
  };
}
