/*
  Warnings:

  - You are about to drop the column `activityTags` on the `MoodEntry` table. All the data in the column will be lost.
  - You are about to drop the column `audioFeatures` on the `MoodEntry` table. All the data in the column will be lost.
  - You are about to drop the column `emotionScores` on the `MoodEntry` table. All the data in the column will be lost.
  - You are about to drop the column `suggestedEmojis` on the `MoodEntry` table. All the data in the column will be lost.
  - You are about to drop the column `transcription` on the `MoodEntry` table. All the data in the column will be lost.
  - You are about to drop the column `userNotes` on the `MoodEntry` table. All the data in the column will be lost.
  - Added the required column `audioFilePath` to the `MoodEntry` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "MoodEntry" DROP COLUMN "activityTags",
DROP COLUMN "audioFeatures",
DROP COLUMN "emotionScores",
DROP COLUMN "suggestedEmojis",
DROP COLUMN "transcription",
DROP COLUMN "userNotes",
ADD COLUMN     "audioFilePath" TEXT NOT NULL;
