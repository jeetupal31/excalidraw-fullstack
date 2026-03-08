import type { PrismaClient } from "@prisma/client";
import type { Prisma } from "@prisma/client";

export interface BoardState {
  elements: Prisma.JsonValue;
  files: Prisma.JsonValue;
}

export class DatabaseService {
  constructor(private readonly prisma: PrismaClient) {}

  async loadBoardState(roomId: string): Promise<BoardState | null> {
    const board = await this.prisma.board.findUnique({
      where: { id: roomId },
    });

    if (!board) {
      return null;
    }

    return {
      elements: board.elements,
      files: board.files,
    };
  }

  async saveBoardState(
    roomId: string,
    elements: Prisma.InputJsonValue,
    files?: Prisma.InputJsonValue
  ): Promise<void> {
    const data: { elements: Prisma.InputJsonValue; files?: Prisma.InputJsonValue } = { elements };
    if (files) {
      data.files = files;
    }

    await this.prisma.board.upsert({
      where: { id: roomId },
      update: data,
      create: { id: roomId, ...data },
    });
  }

  async getUserBoards(userId: string): Promise<{ id: string; name: string; role: string; updatedAt: Date }[]> {
    const memberships = await this.prisma.boardMember.findMany({
      where: { userId },
      include: { board: { select: { id: true, name: true, updatedAt: true } } },
      orderBy: { board: { updatedAt: "desc" } },
    });

    return memberships.map((m: any) => ({
      id: m.board.id,
      name: m.board.name,
      role: m.role,
      updatedAt: m.board.updatedAt,
    }));
  }

  async addBoardMember(boardId: string, userId: string, role: string): Promise<void> {
    await this.prisma.boardMember.upsert({
      where: { userId_boardId: { userId, boardId } },
      update: { role },
      create: { userId, boardId, role },
    });
  }

  async getBoardRole(boardId: string, userId: string): Promise<string | null> {
    const member = await this.prisma.boardMember.findUnique({
      where: { userId_boardId: { userId, boardId } },
    });

    return member?.role ?? null;
  }

  async renameBoard(userId: string, boardId: string, newName: string): Promise<void> {
    // Basic authorization: Verify user is a member (ideally "owner" role in future)
    const role = await this.getBoardRole(boardId, userId);
    if (!role) {
      throw new Error("Unauthorized to rename this board.");
    }
    
    await this.prisma.board.update({
      where: { id: boardId },
      data: { name: newName },
    });
  }

  async deleteBoard(userId: string, boardId: string): Promise<void> {
    // Only "owner" role can delete (default role is "editor", let's assume creator gets owner).
    // For now, if role is anything except null, we'll allow deleting the board, or just remove them from the board. 
    // True deletion deletes the whole board.
    const role = await this.getBoardRole(boardId, userId);
    if (!role) {
      throw new Error("Unauthorized to delete this board.");
    }

    // Delete cascading references manually or rely on foreign keys
    await this.prisma.boardMember.deleteMany({ where: { boardId } });
    await this.prisma.boardVersion.deleteMany({ where: { boardId } });
    await this.prisma.board.delete({ where: { id: boardId } });
  }

  async getBoardVersions(userId: string, boardId: string) {
    const role = await this.getBoardRole(boardId, userId);
    if (!role) {
      throw new Error("Unauthorized access.");
    }

    return await this.prisma.boardVersion.findMany({
      where: { boardId },
      select: { id: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async saveBoardVersion(userId: string, boardId: string): Promise<void> {
    const role = await this.getBoardRole(boardId, userId);
    if (!role || role === "viewer") {
      throw new Error("Unauthorized to save version.");
    }

    const board = await this.prisma.board.findUnique({
      where: { id: boardId },
      select: { elements: true, files: true },
    });

    if (!board) throw new Error("Board not found.");

    await this.prisma.boardVersion.create({
      data: {
        boardId,
        elements: board.elements as Prisma.InputJsonValue,
        files: board.files as Prisma.InputJsonValue,
      },
    });
  }

  async restoreBoardVersion(userId: string, boardId: string, versionId: string): Promise<void> {
    const role = await this.getBoardRole(boardId, userId);
    if (!role || role === "viewer") {
      throw new Error("Unauthorized to restore version.");
    }

    const version = await this.prisma.boardVersion.findUnique({
      where: { id: versionId },
    });

    if (!version || version.boardId !== boardId) {
      throw new Error("Version not found.");
    }

    // Overwrite the current board state with the selected version
    await this.prisma.board.update({
      where: { id: boardId },
      data: {
        elements: version.elements as Prisma.InputJsonValue,
        files: version.files as Prisma.InputJsonValue,
      },
    });
  }

  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }
}
