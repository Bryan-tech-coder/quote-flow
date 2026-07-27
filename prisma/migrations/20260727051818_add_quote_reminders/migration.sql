-- AlterEnum
ALTER TYPE "NotificationEvent" ADD VALUE 'QUOTE_REMINDER';

-- AlterTable
ALTER TABLE "Quote" ADD COLUMN     "reminderSentAt" TIMESTAMP(3);
