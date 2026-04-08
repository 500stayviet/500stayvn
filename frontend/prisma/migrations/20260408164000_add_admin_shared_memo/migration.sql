-- CreateTable
CREATE TABLE "AdminSharedMemo" (
    "id" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminSharedMemo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdminSharedMemo_targetType_targetId_category_createdAt_idx"
ON "AdminSharedMemo"("targetType", "targetId", "category", "createdAt");
