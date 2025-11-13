/*
  Warnings:

  - Added the required column `dayOfWeek` to the `MoodEntry` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "MoodEntry" ADD COLUMN     "dayOfWeek" TEXT NOT NULL;
