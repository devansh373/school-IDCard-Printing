/*
  Warnings:

  - The values [ONBOARDING] on the enum `VendorStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "VendorStatus_new" AS ENUM ('ACTIVE', 'INACTIVE');
ALTER TABLE "User" ALTER COLUMN "vendorStatus" TYPE "VendorStatus_new" USING ("vendorStatus"::text::"VendorStatus_new");
ALTER TYPE "VendorStatus" RENAME TO "VendorStatus_old";
ALTER TYPE "VendorStatus_new" RENAME TO "VendorStatus";
DROP TYPE "public"."VendorStatus_old";
COMMIT;

-- AlterTable
ALTER TABLE "School" ADD COLUMN     "logoUrl" TEXT;
