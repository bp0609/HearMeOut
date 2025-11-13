-- AlterTable
ALTER TABLE "UserSettings" ADD COLUMN     "audioStorageConsent" BOOLEAN,
ADD COLUMN     "audioStorageEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "consentGivenAt" TIMESTAMP(3);
