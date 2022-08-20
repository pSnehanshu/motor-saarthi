-- CreateTable
CREATE TABLE "ContactAttempt" (
    "id" TEXT NOT NULL,
    "vehicle_id" TEXT NOT NULL,
    "qr_id" TEXT NOT NULL,
    "reason" VARCHAR(20) NOT NULL,

    CONSTRAINT "ContactAttempt_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ContactAttempt" ADD CONSTRAINT "ContactAttempt_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactAttempt" ADD CONSTRAINT "ContactAttempt_qr_id_fkey" FOREIGN KEY ("qr_id") REFERENCES "QR"("id") ON DELETE CASCADE ON UPDATE CASCADE;
