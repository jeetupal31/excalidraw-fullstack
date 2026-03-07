-- CreateTable
CREATE TABLE "Board" (
    "id" TEXT NOT NULL,
    "elements" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Board_pkey" PRIMARY KEY ("id")
);
