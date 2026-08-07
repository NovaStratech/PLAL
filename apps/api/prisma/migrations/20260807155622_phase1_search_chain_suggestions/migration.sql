/*
  Warnings:

  - You are about to drop the column `recommenderId` on the `IntroductionRequest` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[currentStepId]` on the table `IntroductionRequest` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "IntroductionStepStatus" AS ENUM ('pending', 'accepted', 'declined');

-- CreateEnum
CREATE TYPE "IntroductionResponseType" AS ENUM ('phone', 'email', 'social');

-- DropForeignKey
ALTER TABLE "IntroductionRequest" DROP CONSTRAINT "IntroductionRequest_recommenderId_fkey";

-- DropIndex
DROP INDEX "IntroductionRequest_recommenderId_idx";

-- AlterTable
ALTER TABLE "IntroductionRequest" DROP COLUMN "recommenderId",
ADD COLUMN     "currentStepId" TEXT,
ADD COLUMN     "responseType" "IntroductionResponseType",
ADD COLUMN     "responseValue" TEXT;

-- CreateTable
CREATE TABLE "CategorySuggestion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "adminNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CategorySuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntroductionStep" (
    "id" TEXT NOT NULL,
    "introductionRequestId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "IntroductionStepStatus" NOT NULL DEFAULT 'pending',
    "order" INTEGER NOT NULL,
    "responseMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntroductionStep_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CategorySuggestion_userId_idx" ON "CategorySuggestion"("userId");

-- CreateIndex
CREATE INDEX "CategorySuggestion_status_idx" ON "CategorySuggestion"("status");

-- CreateIndex
CREATE INDEX "IntroductionStep_introductionRequestId_idx" ON "IntroductionStep"("introductionRequestId");

-- CreateIndex
CREATE INDEX "IntroductionStep_userId_idx" ON "IntroductionStep"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "IntroductionRequest_currentStepId_key" ON "IntroductionRequest"("currentStepId");

-- CreateIndex
CREATE INDEX "IntroductionRequest_recommendationId_idx" ON "IntroductionRequest"("recommendationId");

-- AddForeignKey
ALTER TABLE "CategorySuggestion" ADD CONSTRAINT "CategorySuggestion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntroductionRequest" ADD CONSTRAINT "IntroductionRequest_currentStepId_fkey" FOREIGN KEY ("currentStepId") REFERENCES "IntroductionStep"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntroductionStep" ADD CONSTRAINT "IntroductionStep_introductionRequestId_fkey" FOREIGN KEY ("introductionRequestId") REFERENCES "IntroductionRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntroductionStep" ADD CONSTRAINT "IntroductionStep_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
