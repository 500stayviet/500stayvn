CREATE TABLE IF NOT EXISTS "AdminModerationAudit" (
  "id" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "targetType" TEXT NOT NULL,
  "targetId" TEXT NOT NULL,
  "ownerId" TEXT,
  "reason" TEXT,
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AdminModerationAudit_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "AdminModerationAudit_createdAt_action_idx"
  ON "AdminModerationAudit"("createdAt", "action");
CREATE INDEX IF NOT EXISTS "AdminModerationAudit_targetType_targetId_createdAt_idx"
  ON "AdminModerationAudit"("targetType", "targetId", "createdAt");
