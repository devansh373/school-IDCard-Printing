-- CreateEnum
CREATE TYPE "PhotoStatus" AS ENUM ('NOT_UPLOADED', 'UPLOADED', 'APPROVED');

-- CreateEnum
CREATE TYPE "PrintStatus" AS ENUM ('PENDING', 'READY', 'PRINTED', 'DELIVERED');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'SCHOOL_ADMIN', 'VENDOR', 'TEACHER');

-- CreateEnum
CREATE TYPE "VendorStatus" AS ENUM ('ONBOARDING', 'ACTIVE', 'INACTIVE');

-- CreateTable
CREATE TABLE "School" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "address" TEXT,
    "contactNumber" TEXT,
    "affiliationNumber" TEXT,
    "registrationNumber" TEXT,
    "registrationDetails" TEXT,
    "authoritySignatureUrl" TEXT,
    "principalSignatureUrl" TEXT,
    "imagekitPublicKey" TEXT,
    "imagekitPrivateKey" TEXT,
    "imagekitUrlEndpoint" TEXT,
    "imagekitFolder" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "School_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Class" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "schoolId" INTEGER NOT NULL,

    CONSTRAINT "Class_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Section" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "classId" INTEGER NOT NULL,

    CONSTRAINT "Section_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Student" (
    "id" SERIAL NOT NULL,
    "enrollmentNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fatherName" TEXT,
    "phoneNumber" TEXT,
    "email" TEXT,
    "schoolId" INTEGER NOT NULL,
    "classId" INTEGER NOT NULL,
    "sectionId" INTEGER NOT NULL,
    "photoUrl" TEXT,
    "photoStatus" "PhotoStatus" NOT NULL DEFAULT 'NOT_UPLOADED',
    "printStatus" "PrintStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "schoolId" INTEGER,
    "vendorName" TEXT,
    "phoneNumber" TEXT,
    "location" TEXT,
    "vendorStatus" "VendorStatus",
    "schoolIds" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "School_code_key" ON "School"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Student_enrollmentNumber_key" ON "Student"("enrollmentNumber");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Class" ADD CONSTRAINT "Class_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE SET NULL ON UPDATE CASCADE;
