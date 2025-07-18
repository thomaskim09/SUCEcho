/*
  Warnings:

  - You are about to drop the column `advertisementUrl` on the `Post` table. All the data in the column will be lost.

*/
-- AlterEnum
ALTER TYPE "PostType" ADD VALUE 'LINK';

-- AlterTable
ALTER TABLE "Post" DROP COLUMN "advertisementUrl",
ADD COLUMN     "url" TEXT;
