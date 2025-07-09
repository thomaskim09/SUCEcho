-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "parentReplyId" INTEGER;

-- CreateIndex
CREATE INDEX "Post_fingerprintHash_idx" ON "Post"("fingerprintHash");

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_parentReplyId_fkey" FOREIGN KEY ("parentReplyId") REFERENCES "Post"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
