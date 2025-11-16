/*
Warnings:

- Added the required column `triggeredByEntryId` to the `PatternAlert` table without a default value. This is not possible if the table is not empty.

*/

-- Step 1: Add the column as nullable first
ALTER TABLE "PatternAlert" ADD COLUMN "triggeredByEntryId" TEXT;

-- Step 2: For existing alerts, set triggeredByEntryId to the user's most recent mood entry
-- This is a best-effort migration for existing data
UPDATE "PatternAlert"
SET
    "triggeredByEntryId" = (
        SELECT "MoodEntry"."id"
        FROM "MoodEntry"
        WHERE
            "MoodEntry"."userId" = "PatternAlert"."userId"
        ORDER BY "MoodEntry"."createdAt" DESC
        LIMIT 1
    )
WHERE
    "triggeredByEntryId" IS NULL;

-- Step 3: If any alerts still don't have a triggered entry (orphaned alerts), delete them
DELETE FROM "PatternAlert" WHERE "triggeredByEntryId" IS NULL;

-- Step 4: Now make the column NOT NULL
ALTER TABLE "PatternAlert"
ALTER COLUMN "triggeredByEntryId"
SET NOT NULL;

-- Step 5: Create the index
CREATE INDEX "PatternAlert_triggeredByEntryId_idx" ON "PatternAlert" ("triggeredByEntryId");

-- Step 6: Add the foreign key constraint
ALTER TABLE "PatternAlert"
ADD CONSTRAINT "PatternAlert_triggeredByEntryId_fkey" FOREIGN KEY ("triggeredByEntryId") REFERENCES "MoodEntry" ("id") ON DELETE CASCADE ON UPDATE CASCADE;