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

  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }
}
