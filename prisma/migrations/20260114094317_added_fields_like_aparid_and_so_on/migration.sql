/*
  Warnings:

  - You are about to drop the column `name` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `phoneNumber` on the `Student` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[admissionNo]` on the table `Student` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `firstName` to the `Student` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Student" DROP COLUMN "name",
DROP COLUMN "phoneNumber",
ADD COLUMN     "aadhar" TEXT,
ADD COLUMN     "admissionNo" TEXT,
ADD COLUMN     "aparId" TEXT,
ADD COLUMN     "bloodGroup" TEXT,
ADD COLUMN     "currentAddress" TEXT,
ADD COLUMN     "dateOfBirth" TIMESTAMP(3),
ADD COLUMN     "firstName" TEXT NOT NULL,
ADD COLUMN     "gender" TEXT,
ADD COLUMN     "houseName" TEXT,
ADD COLUMN     "lastName" TEXT,
ADD COLUMN     "middleName" TEXT,
ADD COLUMN     "mobileNo" TEXT,
ADD COLUMN     "motherName" TEXT,
ADD COLUMN     "pan" TEXT,
ADD COLUMN     "religion" TEXT,
ADD COLUMN     "remarks" TEXT,
ADD COLUMN     "rollNo" TEXT,
ADD COLUMN     "uniqueId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Student_admissionNo_key" ON "Student"("admissionNo");
