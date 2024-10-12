/*
  Warnings:

  - Changed the type of `status` on the `submissions` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('passed', 'failed', 'pending');

-- AlterTable
ALTER TABLE "submissions" DROP COLUMN "status",
ADD COLUMN     "status" "SubmissionStatus" NOT NULL;
