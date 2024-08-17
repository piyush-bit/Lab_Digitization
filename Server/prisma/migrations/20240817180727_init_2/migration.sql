/*
  Warnings:

  - You are about to drop the column `department` on the `instructors` table. All the data in the column will be lost.
  - You are about to drop the column `department` on the `students` table. All the data in the column will be lost.
  - You are about to drop the `lab_attendance` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `departmentId` to the `programs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `departmentId` to the `students` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lab_session_id` to the `submissions` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "lab_attendance" DROP CONSTRAINT "lab_attendance_lab_session_id_fkey";

-- DropForeignKey
ALTER TABLE "lab_attendance" DROP CONSTRAINT "lab_attendance_program_id_fkey";

-- DropForeignKey
ALTER TABLE "lab_attendance" DROP CONSTRAINT "lab_attendance_student_id_fkey";

-- AlterTable
ALTER TABLE "instructors" DROP COLUMN "department",
ADD COLUMN     "departmentId" INTEGER;

-- AlterTable
ALTER TABLE "programs" ADD COLUMN     "departmentId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "students" DROP COLUMN "department",
ADD COLUMN     "departmentId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "submissions" ADD COLUMN     "lab_session_id" INTEGER NOT NULL;

-- DropTable
DROP TABLE "lab_attendance";

-- CreateTable
CREATE TABLE "departments" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ProgramToStudent" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "departments_name_key" ON "departments"("name");

-- CreateIndex
CREATE UNIQUE INDEX "_ProgramToStudent_AB_unique" ON "_ProgramToStudent"("A", "B");

-- CreateIndex
CREATE INDEX "_ProgramToStudent_B_index" ON "_ProgramToStudent"("B");

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "programs" ADD CONSTRAINT "programs_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "instructors" ADD CONSTRAINT "instructors_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_lab_session_id_fkey" FOREIGN KEY ("lab_session_id") REFERENCES "lab_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProgramToStudent" ADD CONSTRAINT "_ProgramToStudent_A_fkey" FOREIGN KEY ("A") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProgramToStudent" ADD CONSTRAINT "_ProgramToStudent_B_fkey" FOREIGN KEY ("B") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
