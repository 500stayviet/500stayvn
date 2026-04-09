CREATE TABLE IF NOT EXISTS "AdminSystemLog" (
  "id" TEXT NOT NULL,
  "ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "severity" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "category" TEXT,
  "bookingId" TEXT,
  "ownerId" TEXT,
  "snapshotJson" JSONB,
  "createdBy" TEXT,
  CONSTRAINT "AdminSystemLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "AdminSystemLog_ts_severity_idx"
  ON "AdminSystemLog"("ts", "severity");
CREATE INDEX IF NOT EXISTS "AdminSystemLog_category_ts_idx"
  ON "AdminSystemLog"("category", "ts");
