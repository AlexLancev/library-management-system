/*
  Warnings:

  - Added the required column `updatedAt` to the `genres` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "genres" ADD COLUMN     "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMPTZ NOT NULL;
