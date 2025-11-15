-- AddForeignKey
ALTER TABLE "MoodEntryActivity" ADD CONSTRAINT "MoodEntryActivity_activityKey_fkey" FOREIGN KEY ("activityKey") REFERENCES "Activity"("key") ON DELETE CASCADE ON UPDATE CASCADE;
