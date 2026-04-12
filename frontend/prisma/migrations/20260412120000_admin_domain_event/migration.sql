-- CreateTable
CREATE TABLE "AdminDomainEvent" (
    "id" SERIAL NOT NULL,
    "resource" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resourceId" TEXT,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminDomainEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdminDomainEvent_createdAt_idx" ON "AdminDomainEvent"("createdAt");
