/*
  Warnings:

  - A unique constraint covering the columns `[refreshToken]` on the table `staff` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "staff" ADD COLUMN     "refreshTokenExpiresAt" TIMESTAMPTZ,
ADD COLUMN     "refreshTokenIssuedAt" TIMESTAMPTZ;

-- CreateIndex
CREATE UNIQUE INDEX "staff_refreshToken_key" ON "staff"("refreshToken");

-- CreateIndex
CREATE INDEX "staff_refreshTokenExpiresAt_idx" ON "staff"("refreshTokenExpiresAt");
