ALTER TABLE "PaymentRecord"
  ADD COLUMN IF NOT EXISTS "idempotencyKey" TEXT,
  ADD COLUMN IF NOT EXISTS "webhookEventId" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "PaymentRecord_externalPaymentId_key"
  ON "PaymentRecord"("externalPaymentId")
  WHERE "externalPaymentId" IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "PaymentRecord_idempotencyKey_key"
  ON "PaymentRecord"("idempotencyKey")
  WHERE "idempotencyKey" IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "PaymentRecord_webhookEventId_key"
  ON "PaymentRecord"("webhookEventId")
  WHERE "webhookEventId" IS NOT NULL;
