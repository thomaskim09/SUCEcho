-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('REPLY_TO_POST', 'REPLY_TO_REPLY');

-- CreateTable
CREATE TABLE "Notification" (
    "id" SERIAL NOT NULL,
    "recipientFingerprintHash" TEXT NOT NULL,
    "postId" INTEGER NOT NULL,
    "replyId" INTEGER,
    "type" "NotificationType" NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notification_recipientFingerprintHash_idx" ON "Notification"("recipientFingerprintHash");

-- CreateIndex
CREATE UNIQUE INDEX "Notification_recipientFingerprintHash_postId_replyId_type_key" ON "Notification"("recipientFingerprintHash", "postId", "replyId", "type");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
