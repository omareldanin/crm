/*
  Warnings:

  - You are about to drop the column `weekTimes` on the `Vendor` table. All the data in the column will be lost.

*/
-- AlterEnum
ALTER TYPE "NotificationTopic" ADD VALUE 'ALL';

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "token" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Vendor" DROP COLUMN "weekTimes";
