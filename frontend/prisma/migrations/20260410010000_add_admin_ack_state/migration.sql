CREATE TABLE IF NOT EXISTS "AdminAckState" (
  "id" TEXT NOT NULL,
  "adminUsername" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "targetId" TEXT NOT NULL,
  "acknowledgedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AdminAckState_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "AdminAckState_adminUsername_category_targetId_key"
  ON "AdminAckState"("adminUsername", "category", "targetId");

CREATE INDEX IF NOT EXISTS "AdminAckState_adminUsername_category_acknowledgedAt_idx"
  ON "AdminAckState"("adminUsername", "category", "acknowledgedAt");
