-- AlterTable
ALTER TABLE "Friendship" ADD COLUMN     "blockedAt" TIMESTAMP(3),
ADD COLUMN     "blockedById" TEXT;

-- CreateIndex
CREATE INDEX "Friendship_blockedById_idx" ON "Friendship"("blockedById");
