-- AlterTable: Make branch and semester optional in StudentProfile and Enrollment
ALTER TABLE "StudentProfile" ALTER COLUMN "program" DROP NOT NULL;
ALTER TABLE "StudentProfile" ALTER COLUMN "program" SET DEFAULT 'B.Tech';
ALTER TABLE "StudentProfile" ALTER COLUMN "branch" DROP NOT NULL;
ALTER TABLE "StudentProfile" ALTER COLUMN "semester" DROP NOT NULL;
ALTER TABLE "StudentProfile" ALTER COLUMN "yearOfStudy" DROP NOT NULL;
ALTER TABLE "StudentProfile" ALTER COLUMN "yearOfStudy" SET DEFAULT 1;

ALTER TABLE "Enrollment" ALTER COLUMN "program" DROP NOT NULL;
ALTER TABLE "Enrollment" ALTER COLUMN "program" SET DEFAULT 'B.Tech';
ALTER TABLE "Enrollment" ALTER COLUMN "branch" DROP NOT NULL;
ALTER TABLE "Enrollment" ALTER COLUMN "semester" DROP NOT NULL;
