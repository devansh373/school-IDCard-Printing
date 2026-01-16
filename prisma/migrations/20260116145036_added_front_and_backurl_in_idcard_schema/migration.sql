/*
  Warnings:

  - You are about to drop the column `previewUrl` on the `IdCard` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "IdCard" DROP COLUMN "previewUrl",
ADD COLUMN     "backUrl" TEXT,
ADD COLUMN     "frontUrl" TEXT;
