/*
  Warnings:

  - You are about to drop the column `aadhar` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `admissionNo` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `aparId` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `enrollmentNumber` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `fatherName` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `firstName` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `houseName` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `lastName` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `middleName` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `mobileNo` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `motherName` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `pan` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `remarks` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `uniqueId` on the `Student` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[aparIdOrPan]` on the table `Student` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `aparIdOrPan` to the `Student` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `Student` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Student_admissionNo_key";

-- DropIndex
DROP INDEX "Student_enrollmentNumber_key";

-- AlterTable
ALTER TABLE "Student" DROP COLUMN "aadhar",
DROP COLUMN "admissionNo",
DROP COLUMN "aparId",
DROP COLUMN "email",
DROP COLUMN "enrollmentNumber",
DROP COLUMN "fatherName",
DROP COLUMN "firstName",
DROP COLUMN "houseName",
DROP COLUMN "lastName",
DROP COLUMN "middleName",
DROP COLUMN "mobileNo",
DROP COLUMN "motherName",
DROP COLUMN "pan",
DROP COLUMN "remarks",
DROP COLUMN "uniqueId",
ADD COLUMN     "aparIdOrPan" TEXT NOT NULL,
ADD COLUMN     "guardianMobileNo" TEXT,
ADD COLUMN     "name" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Student_aparIdOrPan_key" ON "Student"("aparIdOrPan");
