/*
  Warnings:

  - You are about to drop the column `type` on the `Post` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('TEXT', 'POLL', 'LINK', 'ANNOUNCEMENT', 'ADVERTISEMENT');

-- CreateEnum
CREATE TYPE "FeedType" AS ENUM ('EPHEMERAL', 'PERMANENT', 'JOB');

-- DropIndex
DROP INDEX "Post_type_idx";

-- AlterTable
ALTER TABLE "Post" DROP COLUMN "type",
ADD COLUMN     "contentType" "ContentType" NOT NULL DEFAULT 'TEXT',
ADD COLUMN     "feed" "FeedType" NOT NULL DEFAULT 'EPHEMERAL';

-- DropEnum
DROP TYPE "PostType";

-- CreateIndex
CREATE INDEX "Post_feed_idx" ON "Post"("feed");

-- CreateIndex
CREATE INDEX "Post_contentType_idx" ON "Post"("contentType");
