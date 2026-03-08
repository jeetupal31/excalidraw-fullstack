import type { Request, Response } from "express";
import type { DatabaseService } from "../services/DatabaseService";

export function createBoardController(databaseService: DatabaseService) {
  const getUserBoards = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required." });
      return;
    }

    try {
      const boards = await databaseService.getUserBoards(req.user.id);
      res.status(200).json({ boards });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch boards.";
      res.status(500).json({ error: message });
    }
  }; // Fixed missing closing brace

  const renameBoard = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required." });
      return;
    }
    const { id } = req.params;
    const { name } = req.body;
    
    if (!name || typeof name !== "string") {
      res.status(400).json({ error: "Board name is required." });
      return;
    }

    try {
      await databaseService.renameBoard(req.user.id, id as string, name);
      res.status(200).json({ success: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to rename board.";
      res.status(500).json({ error: message });
    }
  };

  const deleteBoard = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required." });
      return;
    }
    const { id } = req.params;

    try {
      await databaseService.deleteBoard(req.user.id, id as string);
      res.status(200).json({ success: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete board.";
      res.status(500).json({ error: message });
    }
  };

  const getVersions = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required." });
      return;
    }
    try {
      const versions = await databaseService.getBoardVersions(req.user.id, req.params.id as string);
      res.status(200).json({ versions });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch versions.";
      res.status(500).json({ error: message });
    }
  };

  const saveVersion = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required." });
      return;
    }
    try {
      await databaseService.saveBoardVersion(req.user.id, req.params.id as string);
      res.status(200).json({ success: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save version.";
      res.status(500).json({ error: message });
    }
  };

  const restoreVersion = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required." });
      return;
    }
    const { versionId } = req.body;
    if (!versionId) {
      res.status(400).json({ error: "Version ID required." });
      return;
    }
    try {
      await databaseService.restoreBoardVersion(req.user.id, req.params.id as string, versionId as string);
      res.status(200).json({ success: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to restore version.";
      res.status(500).json({ error: message });
    }
  };

  return { getUserBoards, renameBoard, deleteBoard, getVersions, saveVersion, restoreVersion };
}
