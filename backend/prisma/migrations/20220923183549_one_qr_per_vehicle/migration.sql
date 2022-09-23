/*
  Warnings:

  - A unique constraint covering the columns `[vehicle_id]` on the table `QR` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "QR_vehicle_id_key" ON "QR"("vehicle_id");
