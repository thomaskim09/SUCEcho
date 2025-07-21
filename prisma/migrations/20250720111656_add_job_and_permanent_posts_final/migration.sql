-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PostType" ADD VALUE 'PERMANENT';
ALTER TYPE "PostType" ADD VALUE 'JOB';

-- AlterTable
ALTER TABLE "PostStats" ADD COLUMN     "averageRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "ratingCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "JobRating" (
    "id" SERIAL NOT NULL,
    "postId" INTEGER NOT NULL,
    "fingerprintHash" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobRating_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "JobRating_postId_fingerprintHash_key" ON "JobRating"("postId", "fingerprintHash");

-- AddForeignKey
ALTER TABLE "JobRating" ADD CONSTRAINT "JobRating_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
