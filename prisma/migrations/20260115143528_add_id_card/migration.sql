-- CreateEnum
CREATE TYPE "IdCardStatus" AS ENUM ('PENDING', 'READY');

-- CreateTable
CREATE TABLE "IdCard" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "previewUrl" TEXT,
    "status" "IdCardStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IdCard_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "IdCard_studentId_key" ON "IdCard"("studentId");

-- AddForeignKey
ALTER TABLE "IdCard" ADD CONSTRAINT "IdCard_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
