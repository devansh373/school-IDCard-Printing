/*
  Warnings:

  - You are about to drop the column `templateUrl` on the `School` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "School" DROP COLUMN "templateUrl",
ADD COLUMN     "templateBackUrl" TEXT,
ADD COLUMN     "templateFrontUrl" TEXT;
