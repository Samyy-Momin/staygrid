/*
  Warnings:

  - You are about to drop the `Farmhouse` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Booking" DROP CONSTRAINT "Booking_farmhouseId_fkey";

-- DropForeignKey
ALTER TABLE "Farmhouse" DROP CONSTRAINT "Farmhouse_ownerId_fkey";

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "razorpayOrderId" TEXT,
ADD COLUMN     "razorpayPaymentId" TEXT;

-- DropTable
DROP TABLE "Farmhouse";

-- CreateTable
CREATE TABLE "farmhouse" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "pricePerNight" DOUBLE PRECISION NOT NULL,
    "capacity" INTEGER NOT NULL,
    "poolSize" TEXT,
    "amenities" TEXT[],
    "photos" TEXT[],
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "farmhouse_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "farmhouse" ADD CONSTRAINT "farmhouse_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_farmhouseId_fkey" FOREIGN KEY ("farmhouseId") REFERENCES "farmhouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
