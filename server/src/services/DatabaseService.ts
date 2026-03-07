import type { PrismaClient } from "@prisma/client";
import type { Prisma } from "@prisma/client";

export class DatabaseService {
  constructor(private readonly prisma: PrismaClient) {}

  async loadBoardState(roomId: string): Promise<Prisma.JsonValue | null> {
    const board = await this.prisma.board.findUnique({
      where: { id: roomId },
      select: { elements: true },
    });

    return board?.elements ?? null;
  }

  async saveBoardState(roomId: string, elements: Prisma.InputJsonValue): Promise<void> {
    // Upsert keeps persistence idempotent per room and avoids race-prone read-before-write code.
    await this.prisma.board.upsert({
      where: { id: roomId },
      update: { elements },
      create: { id: roomId, elements },
    });
  }

  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }
}
