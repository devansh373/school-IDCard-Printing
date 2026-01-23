-- AlterTable: Step 1 (Add as Nullable)
ALTER TABLE "Student" ADD COLUMN "aparIdOrPan" TEXT;
ALTER TABLE "Student" ADD COLUMN "guardianMobileNo" TEXT;
ALTER TABLE "Student" ADD COLUMN "name" TEXT;

-- Data Migration: Step 2 (Copy values from old columns)
UPDATE "Student" SET 
  "name" = TRIM(COALESCE("firstName", '') || ' ' || COALESCE("lastName", '')),
  "aparIdOrPan" = COALESCE("enrollmentNumber", "aparId", "admissionNo", 'TEMP_' || id::text),
  "guardianMobileNo" = "mobileNo";

-- Handle any remaining nulls if columns were completely empty
UPDATE "Student" SET "name" = 'Unknown Student' WHERE "name" IS NULL OR "name" = '';
UPDATE "Student" SET "aparIdOrPan" = 'AUTO_' || id::text WHERE "aparIdOrPan" IS NULL;

-- AlterTable: Step 3 (Set Not Null and Drop Columns)
ALTER TABLE "Student" 
  ALTER COLUMN "aparIdOrPan" SET NOT NULL,
  ALTER COLUMN "name" SET NOT NULL,
  DROP COLUMN "aadhar",
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
  DROP COLUMN "uniqueId";

-- DropIndex
DROP INDEX IF EXISTS "Student_admissionNo_key";
DROP INDEX IF EXISTS "Student_enrollmentNumber_key";

-- CreateIndex
CREATE UNIQUE INDEX "Student_aparIdOrPan_key" ON "Student"("aparIdOrPan");
