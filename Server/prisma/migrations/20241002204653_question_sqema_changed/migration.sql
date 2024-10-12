/*
  Warnings:

  - You are about to drop the column `result_details` on the `submissions` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "questions" ADD COLUMN     "testCaseBased" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "submissions" DROP COLUMN "result_details",
ADD COLUMN     "resultDetails" TEXT,
ADD COLUMN     "solution" TEXT;
