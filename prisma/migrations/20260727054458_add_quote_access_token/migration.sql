-- AlterTable: add accessToken as nullable first (existing rows need a value before
-- we can enforce NOT NULL + UNIQUE, since Prisma's @default(cuid()) is client-side only).
ALTER TABLE "Quote" ADD COLUMN "accessToken" TEXT;

-- Backfill existing rows. Reusing the row's own id is fine here — it's already a
-- unique, unguessable cuid; going forward every new row gets an independently
-- generated accessToken via Prisma's @default(cuid()).
UPDATE "Quote" SET "accessToken" = "id" WHERE "accessToken" IS NULL;

-- Now that every row has a value, enforce NOT NULL and uniqueness.
ALTER TABLE "Quote" ALTER COLUMN "accessToken" SET NOT NULL;
CREATE UNIQUE INDEX "Quote_accessToken_key" ON "Quote"("accessToken");
