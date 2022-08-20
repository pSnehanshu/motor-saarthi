/*
  Warnings:

  - You are about to drop the column `ept` on the `Device` table. All the data in the column will be lost.
  - You are about to drop the `ExpoPushTicket` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[token,customer_id,type]` on the table `Device` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `token` to the `Device` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "DeviceType" AS ENUM ('android', 'ios', 'web');

-- DropForeignKey
ALTER TABLE "ExpoPushTicket" DROP CONSTRAINT "ExpoPushTicket_contact_attempt_id_fkey";

-- DropForeignKey
ALTER TABLE "ExpoPushTicket" DROP CONSTRAINT "ExpoPushTicket_customer_id_fkey";

-- DropForeignKey
ALTER TABLE "ExpoPushTicket" DROP CONSTRAINT "ExpoPushTicket_ept_customer_id_fkey";

-- DropIndex
DROP INDEX "Device_ept_customer_id_key";

-- AlterTable
ALTER TABLE "ContactAttempt" ADD COLUMN     "fcmId" TEXT,
ADD COLUMN     "latest_error_code" TEXT;

-- AlterTable
ALTER TABLE "Device" DROP COLUMN "ept",
ADD COLUMN     "token" TEXT NOT NULL,
ADD COLUMN     "type" "DeviceType" NOT NULL DEFAULT 'android';

-- DropTable
DROP TABLE "ExpoPushTicket";

-- CreateIndex
CREATE UNIQUE INDEX "Device_token_customer_id_type_key" ON "Device"("token", "customer_id", "type");
