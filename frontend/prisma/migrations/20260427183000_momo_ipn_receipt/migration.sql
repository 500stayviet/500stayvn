-- MoMo IPN 멱등 영수증 (transId 유니크 앵커)
CREATE TABLE "MomoIpnReceipt" (
    "id" TEXT NOT NULL,
    "transId" TEXT NOT NULL,
    "paymentRecordId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MomoIpnReceipt_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MomoIpnReceipt_transId_key" ON "MomoIpnReceipt"("transId");

CREATE INDEX "MomoIpnReceipt_orderId_idx" ON "MomoIpnReceipt"("orderId");

CREATE INDEX "MomoIpnReceipt_paymentRecordId_idx" ON "MomoIpnReceipt"("paymentRecordId");

ALTER TABLE "MomoIpnReceipt" ADD CONSTRAINT "MomoIpnReceipt_paymentRecordId_fkey" FOREIGN KEY ("paymentRecordId") REFERENCES "PaymentRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;
