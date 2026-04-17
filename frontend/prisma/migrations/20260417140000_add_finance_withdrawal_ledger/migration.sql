-- Server finance single-ledger tables
CREATE TABLE IF NOT EXISTS "AdminBankAccount" (
  "id" TEXT NOT NULL,
  "ownerId" TEXT NOT NULL,
  "bankName" TEXT NOT NULL,
  "accountNumber" TEXT NOT NULL,
  "accountHolder" TEXT NOT NULL,
  "isPrimary" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AdminBankAccount_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AdminWithdrawalRequest" (
  "id" TEXT NOT NULL,
  "ownerId" TEXT NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "bankAccountId" TEXT NOT NULL,
  "bankLabel" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reviewedAt" TIMESTAMP(3),
  "reviewedBy" TEXT,
  "rejectReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AdminWithdrawalRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AdminFinanceLedger" (
  "id" TEXT NOT NULL,
  "ownerId" TEXT NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "type" TEXT NOT NULL,
  "refId" TEXT,
  "note" TEXT,
  "createdBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AdminFinanceLedger_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "AdminBankAccount_ownerId_createdAt_idx"
  ON "AdminBankAccount"("ownerId", "createdAt");
CREATE INDEX IF NOT EXISTS "AdminWithdrawalRequest_ownerId_requestedAt_idx"
  ON "AdminWithdrawalRequest"("ownerId", "requestedAt");
CREATE INDEX IF NOT EXISTS "AdminWithdrawalRequest_status_requestedAt_idx"
  ON "AdminWithdrawalRequest"("status", "requestedAt");
CREATE INDEX IF NOT EXISTS "AdminFinanceLedger_ownerId_createdAt_idx"
  ON "AdminFinanceLedger"("ownerId", "createdAt");
CREATE INDEX IF NOT EXISTS "AdminFinanceLedger_type_createdAt_idx"
  ON "AdminFinanceLedger"("type", "createdAt");
