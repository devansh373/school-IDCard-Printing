/*
  Warnings:

  - The `printStatus` column on the `Student` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "PhotoStatus" AS ENUM ('NOT_UPLOADED', 'UPLOADED');

-- CreateEnum
CREATE TYPE "PrintStatus" AS ENUM ('PENDING', 'READY', 'PRINTED', 'DELIVERED');

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "photoStatus" "PhotoStatus" NOT NULL DEFAULT 'NOT_UPLOADED',
DROP COLUMN "printStatus",
ADD COLUMN     "printStatus" "PrintStatus" NOT NULL DEFAULT 'PENDING';
