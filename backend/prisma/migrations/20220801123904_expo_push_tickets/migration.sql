-- CreateEnum
CREATE TYPE "ExpoTicketStatus" AS ENUM ('ok', 'error');

-- CreateTable
CREATE TABLE "ExpoPushTicket" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "ept" TEXT NOT NULL,
    "receipt_id" TEXT,
    "ticket_status" "ExpoTicketStatus",
    "receipt_status" "ExpoTicketStatus",
    "ticket_error" VARCHAR(30),
    "receipt_error" VARCHAR(30),
    "contact_attempt_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExpoPushTicket_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ExpoPushTicket" ADD CONSTRAINT "ExpoPushTicket_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpoPushTicket" ADD CONSTRAINT "ExpoPushTicket_ept_customer_id_fkey" FOREIGN KEY ("ept", "customer_id") REFERENCES "Device"("ept", "customer_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpoPushTicket" ADD CONSTRAINT "ExpoPushTicket_contact_attempt_id_fkey" FOREIGN KEY ("contact_attempt_id") REFERENCES "ContactAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
