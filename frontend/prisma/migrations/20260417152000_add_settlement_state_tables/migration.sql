-- Settlement state tables for server-side single ledger
CREATE TABLE IF NOT EXISTS "AdminSettlementApproval" (
  "id" TEXT NOT NULL,
  "bookingId" TEXT NOT NULL,
  "ownerId" TEXT NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'approved',
  "approvedBy" TEXT NOT NULL,
  "approvedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AdminSettlementApproval_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "AdminSettlementApproval_bookingId_key"
  ON "AdminSettlementApproval"("bookingId");
CREATE INDEX IF NOT EXISTS "AdminSettlementApproval_ownerId_status_approvedAt_idx"
  ON "AdminSettlementApproval"("ownerId", "status", "approvedAt");

CREATE TABLE IF NOT EXISTS "AdminSettlementPendingQueue" (
  "bookingId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AdminSettlementPendingQueue_pkey" PRIMARY KEY ("bookingId")
);
