-- AlterTable
ALTER TABLE "Departure" ADD COLUMN     "capacity" INTEGER NOT NULL DEFAULT 50;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_departureId_fkey" FOREIGN KEY ("departureId") REFERENCES "Departure"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
