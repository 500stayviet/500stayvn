CREATE TABLE IF NOT EXISTS "AdminPropertyActionLog" (
  "id" TEXT NOT NULL,
  "propertyId" TEXT NOT NULL,
  "actionType" TEXT NOT NULL,
  "reason" TEXT,
  "adminId" TEXT,
  "snapshotJson" JSONB,
  "reservationId" TEXT,
  "ownerId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AdminPropertyActionLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "AdminPropertyActionLog_propertyId_createdAt_idx"
  ON "AdminPropertyActionLog"("propertyId", "createdAt");

CREATE INDEX IF NOT EXISTS "AdminPropertyActionLog_actionType_createdAt_idx"
  ON "AdminPropertyActionLog"("actionType", "createdAt");
