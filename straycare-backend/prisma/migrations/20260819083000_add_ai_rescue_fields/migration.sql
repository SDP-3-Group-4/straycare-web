-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "aiRespondedAt" TIMESTAMP(3),
ADD COLUMN     "aiResponseStatus" TEXT NOT NULL DEFAULT 'pending';
