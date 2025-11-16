-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MoodEntryActivity" (
    "id" TEXT NOT NULL,
    "moodEntryId" TEXT NOT NULL,
    "activityKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MoodEntryActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Activity_key_key" ON "Activity"("key");

-- CreateIndex
CREATE INDEX "Activity_order_idx" ON "Activity"("order");

-- CreateIndex
CREATE INDEX "MoodEntryActivity_moodEntryId_idx" ON "MoodEntryActivity"("moodEntryId");

-- CreateIndex
CREATE INDEX "MoodEntryActivity_activityKey_idx" ON "MoodEntryActivity"("activityKey");

-- CreateIndex
CREATE UNIQUE INDEX "MoodEntryActivity_moodEntryId_activityKey_key" ON "MoodEntryActivity"("moodEntryId", "activityKey");

-- AddForeignKey
ALTER TABLE "MoodEntryActivity" ADD CONSTRAINT "MoodEntryActivity_moodEntryId_fkey" FOREIGN KEY ("moodEntryId") REFERENCES "MoodEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
