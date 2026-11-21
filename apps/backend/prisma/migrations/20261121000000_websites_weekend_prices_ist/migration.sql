-- CreateEnum
CREATE TYPE "WebsiteStatus" AS ENUM ('DRAFT', 'ACTIVE', 'SUSPENDED');

-- AlterTable
ALTER TABLE "farmhouse" ADD COLUMN     "weekendPrice12Hours" DOUBLE PRECISION,
ADD COLUMN     "weekendPrice24Hours" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "website_plan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "monthlyPrice" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "website_plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "website" (
    "id" TEXT NOT NULL,
    "farmhouseId" TEXT NOT NULL,
    "subdomain" TEXT NOT NULL,
    "customDomain" TEXT,
    "status" "WebsiteStatus" NOT NULL DEFAULT 'DRAFT',
    "suspendedReason" TEXT,
    "tagline" TEXT,
    "about" TEXT,
    "usps" TEXT[],
    "whatsappNumber" TEXT,
    "planId" TEXT,
    "paidUntil" TIMESTAMP(3),
    "lastReminderAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "website_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "website_payment" (
    "id" TEXT NOT NULL,
    "websiteId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "months" INTEGER NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "method" TEXT NOT NULL,
    "reference" TEXT,
    "recordedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "website_payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "website_enquiry" (
    "id" TEXT NOT NULL,
    "websiteId" TEXT NOT NULL,
    "farmhouseId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "checkIn" TIMESTAMP(3),
    "guests" INTEGER,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "website_enquiry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "website_plan_name_key" ON "website_plan"("name");

-- CreateIndex
CREATE UNIQUE INDEX "website_farmhouseId_key" ON "website"("farmhouseId");

-- CreateIndex
CREATE UNIQUE INDEX "website_subdomain_key" ON "website"("subdomain");

-- CreateIndex
CREATE UNIQUE INDEX "website_customDomain_key" ON "website"("customDomain");

-- CreateIndex
CREATE INDEX "website_status_paidUntil_idx" ON "website"("status", "paidUntil");

-- CreateIndex
CREATE INDEX "website_payment_websiteId_createdAt_idx" ON "website_payment"("websiteId", "createdAt");

-- CreateIndex
CREATE INDEX "website_enquiry_farmhouseId_createdAt_idx" ON "website_enquiry"("farmhouseId", "createdAt");

-- AddForeignKey
ALTER TABLE "website" ADD CONSTRAINT "website_farmhouseId_fkey" FOREIGN KEY ("farmhouseId") REFERENCES "farmhouse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "website" ADD CONSTRAINT "website_planId_fkey" FOREIGN KEY ("planId") REFERENCES "website_plan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "website_payment" ADD CONSTRAINT "website_payment_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "website"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "website_enquiry" ADD CONSTRAINT "website_enquiry_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "website"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "website_enquiry" ADD CONSTRAINT "website_enquiry_farmhouseId_fkey" FOREIGN KEY ("farmhouseId") REFERENCES "farmhouse"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Data fix: pricing overrides are now keyed by the India (IST) calendar day at 00:00 UTC.
-- Rows written by a server running in IST were stored at 18:30 UTC of the previous day;
-- shifting by +05:30 and truncating to the day maps both old formats onto the new key.
-- (If two rows collapse onto the same day, the newer one wins.)
DELETE FROM "pricing_override" a
USING "pricing_override" b
WHERE a."farmhouseId" = b."farmhouseId"
  AND date_trunc('day', a."date" + interval '5 hours 30 minutes') = date_trunc('day', b."date" + interval '5 hours 30 minutes')
  AND a."id" <> b."id"
  AND (a."updatedAt", a."id") < (b."updatedAt", b."id");

UPDATE "pricing_override"
SET "date" = date_trunc('day', "date" + interval '5 hours 30 minutes')
WHERE "date" <> date_trunc('day', "date" + interval '5 hours 30 minutes');
