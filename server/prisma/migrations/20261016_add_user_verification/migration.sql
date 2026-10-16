-- AlterTable: Add verification and registration fields to User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isEmailVerified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "registrationBranch" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "registrationSemester" INTEGER;

-- Set existing seeded and created users to verified
UPDATE "User" SET "isEmailVerified" = true WHERE "isEmailVerified" = false;
