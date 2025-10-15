-- CreateTable
CREATE TABLE "Tour" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "teaser" TEXT,
    "description" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "heroImage" TEXT,
    "thumbImage" TEXT,
    "duration" TEXT,
    "pickupPoints" TEXT[],
    "gallery" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tour_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Departure" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "unitPriceCents" INTEGER NOT NULL,
    "tourId" TEXT NOT NULL,

    CONSTRAINT "Departure_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tour_slug_key" ON "Tour"("slug");

-- CreateIndex
CREATE INDEX "Departure_tourId_idx" ON "Departure"("tourId");

-- AddForeignKey
ALTER TABLE "Departure" ADD CONSTRAINT "Departure_tourId_fkey" FOREIGN KEY ("tourId") REFERENCES "Tour"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
