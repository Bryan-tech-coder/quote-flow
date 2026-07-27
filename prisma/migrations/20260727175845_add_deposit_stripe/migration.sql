-- AlterEnum
ALTER TYPE "NotificationEvent" ADD VALUE 'DEPOSIT_PAID';

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "depositPercent" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Quote" ADD COLUMN     "depositAmountCents" INTEGER,
ADD COLUMN     "depositPaidAt" TIMESTAMP(3),
ADD COLUMN     "stripeCheckoutSessionId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Quote_stripeCheckoutSessionId_key" ON "Quote"("stripeCheckoutSessionId");

