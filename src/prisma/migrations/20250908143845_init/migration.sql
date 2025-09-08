-- CreateEnum
CREATE TYPE "Permissions" AS ENUM ('MANAGE_VENDORS', 'MANAGE_ORDERS', 'SEND_NOTIFICATIONS', 'MANAGE_DELIVERIES', 'MANAGE_ADMINS', 'MANAGE_PRODUCTS');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'ADMIN_ASSISTANT', 'VENDOR', 'DELIVERY');

-- CreateEnum
CREATE TYPE "NotificationTopic" AS ENUM ('ADMIN', 'ADMIN_ASSISTANT', 'VENDOR', 'DELIVERY');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "phone" TEXT NOT NULL,
    "name" TEXT,
    "avatar" TEXT,
    "fcm" TEXT,
    "password" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "refresh_token" TEXT[],
    "role" "UserRole" NOT NULL,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "vendorId" INTEGER,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Delivery" (
    "id" SERIAL NOT NULL,
    "online" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Delivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Admin" (
    "id" SERIAL NOT NULL,
    "permissions" "Permissions"[],

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vendor" (
    "id" INTEGER NOT NULL,
    "weekTimes" JSONB,
    "address" TEXT,
    "longitudes" TEXT,
    "latitude" TEXT,

    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "topic" "NotificationTopic",
    "userId" INTEGER,
    "seen" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- AddForeignKey
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_id_fkey" FOREIGN KEY ("id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Admin" ADD CONSTRAINT "Admin_id_fkey" FOREIGN KEY ("id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vendor" ADD CONSTRAINT "Vendor_id_fkey" FOREIGN KEY ("id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
