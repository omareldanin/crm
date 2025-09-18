-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "deleted" BOOLEAN DEFAULT false,
ADD COLUMN     "deletedById" INTEGER;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
