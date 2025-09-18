-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PROSSESING', 'WITH_DELIVERY', 'DELEVERIED');

-- AlterTable
ALTER TABLE "Admin" ALTER COLUMN "id" DROP DEFAULT;
DROP SEQUENCE "Admin_id_seq";

-- AlterTable
ALTER TABLE "CartProduct" ADD COLUMN     "orderId" INTEGER;

-- AlterTable
ALTER TABLE "Delivery" ALTER COLUMN "id" DROP DEFAULT;
DROP SEQUENCE "Delivery_id_seq";

-- CreateTable
CREATE TABLE "Order" (
    "id" SERIAL NOT NULL,
    "total" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paidAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,
    "status" "OrderStatus" NOT NULL DEFAULT 'PROSSESING',
    "deliveryId" INTEGER,
    "vendorId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" SERIAL NOT NULL,
    "paidAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "confirmed" BOOLEAN NOT NULL DEFAULT false,
    "vendorId" INTEGER,
    "deliveryId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CartProduct" ADD CONSTRAINT "CartProduct_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "Delivery"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "Delivery"("id") ON DELETE SET NULL ON UPDATE CASCADE;
