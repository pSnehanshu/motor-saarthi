/*
  Warnings:

  - A unique constraint covering the columns `[ept,customer_id]` on the table `Device` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Device_ept_customer_id_key" ON "Device"("ept", "customer_id");
