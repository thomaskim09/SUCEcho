-- CreateEnum
CREATE TYPE "PostType" AS ENUM ('DEFAULT', 'ANNOUNCEMENT', 'ADVERTISEMENT');

-- CreateTable
CREATE TABLE "Post" (
    "id" SERIAL NOT NULL,
    "content" TEXT,
    "fingerprintHash" TEXT NOT NULL,
    "parentPostId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" "PostType" NOT NULL DEFAULT 'DEFAULT',
    "advertisementUrl" TEXT,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" SERIAL NOT NULL,
    "postId" INTEGER NOT NULL,
    "fingerprintHash" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostStats" (
    "postId" INTEGER NOT NULL,
    "upvotes" INTEGER NOT NULL DEFAULT 0,
    "downvotes" INTEGER NOT NULL DEFAULT 0,
    "replyCount" INTEGER NOT NULL DEFAULT 0,
    "hotnessScore" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PostStats_pkey" PRIMARY KEY ("postId")
);

-- CreateTable
CREATE TABLE "Vote" (
    "id" SERIAL NOT NULL,
    "postId" INTEGER NOT NULL,
    "fingerprintHash" TEXT NOT NULL,
    "voteType" INTEGER NOT NULL,

    CONSTRAINT "Vote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAnonymizedProfile" (
    "fingerprintHash" TEXT NOT NULL,
    "codename" TEXT NOT NULL,
    "purifiedPostCount" INTEGER NOT NULL DEFAULT 0,
    "isBanned" BOOLEAN NOT NULL DEFAULT false,
    "banExpiresAt" TIMESTAMP(3),
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserAnonymizedProfile_pkey" PRIMARY KEY ("fingerprintHash")
);

-- CreateTable
CREATE TABLE "AdminLog" (
    "id" SERIAL NOT NULL,
    "targetFingerprintHash" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isAcknowledged" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "AdminLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Post_createdAt_idx" ON "Post"("createdAt");

-- CreateIndex
CREATE INDEX "Post_type_idx" ON "Post"("type");

-- CreateIndex
CREATE UNIQUE INDEX "Report_postId_fingerprintHash_key" ON "Report"("postId", "fingerprintHash");

-- CreateIndex
CREATE UNIQUE INDEX "Vote_postId_fingerprintHash_key" ON "Vote"("postId", "fingerprintHash");

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_parentPostId_fkey" FOREIGN KEY ("parentPostId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostStats" ADD CONSTRAINT "PostStats_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
