/*
  Warnings:

  - A unique constraint covering the columns `[recipientFingerprintHash,postId,type]` on the table `Notification` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Notification_recipientFingerprintHash_postId_type_key" ON "Notification"("recipientFingerprintHash", "postId", "type");
