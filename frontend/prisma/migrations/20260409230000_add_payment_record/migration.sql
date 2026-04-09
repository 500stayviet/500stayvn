CREATE TABLE IF NOT EXISTS "PaymentRecord" (
  "id" TEXT NOT NULL,
  "bookingId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'vnd',
  "status" TEXT NOT NULL DEFAULT 'pending',
  "provider" TEXT,
  "externalPaymentId" TEXT,
  "refundStatus" TEXT,
  "refundAmount" DOUBLE PRECISION,
  "metaJson" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PaymentRecord_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "PaymentRecord_bookingId_createdAt_idx"
  ON "PaymentRecord"("bookingId", "createdAt");
CREATE INDEX IF NOT EXISTS "PaymentRecord_userId_createdAt_idx"
  ON "PaymentRecord"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "PaymentRecord_status_updatedAt_idx"
  ON "PaymentRecord"("status", "updatedAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'PaymentRecord_bookingId_fkey'
  ) THEN
    ALTER TABLE "PaymentRecord"
      ADD CONSTRAINT "PaymentRecord_bookingId_fkey"
      FOREIGN KEY ("bookingId") REFERENCES "Booking"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'PaymentRecord_userId_fkey'
  ) THEN
    ALTER TABLE "PaymentRecord"
      ADD CONSTRAINT "PaymentRecord_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
