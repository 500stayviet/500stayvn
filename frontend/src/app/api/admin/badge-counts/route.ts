import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminFromRequest } from '@/lib/server/adminAuthServer';
import { observeRouteResponse } from '@/lib/server/apiMonitoring';
import { Prisma } from '@prisma/client';

const ADMIN_NEW_MS = 24 * 60 * 60 * 1000;

function dayAgoIso(): string {
  return new Date(Date.now() - ADMIN_NEW_MS).toISOString();
}

export async function GET(request: NextRequest) {
  const startedAt = Date.now();
  const route = 'GET /api/admin/badge-counts';
  const me = await getAdminFromRequest(request);
  if (!me)
    return observeRouteResponse(NextResponse.json({ error: 'unauthorized' }, { status: 401 }), route, startedAt);

  const since = dayAgoIso();
  try {
    const usersNewUnseenPromise = prisma.$queryRaw<Array<{ count: number }>>(Prisma.sql`
      SELECT COUNT(*)::int AS count
      FROM "User" u
      LEFT JOIN "AdminAckState" a
        ON a."adminUsername" = ${me.username}
       AND a."category" = 'users.new'
       AND a."targetId" = u."id"
      WHERE u."deleted" = false
        AND u."createdAt" >= ${since}::timestamptz
        AND a."id" IS NULL
    `);

    const propertiesNewUnseenPromise = prisma.$queryRaw<Array<{ count: number }>>(Prisma.sql`
      SELECT COUNT(*)::int AS count
      FROM "Property" p
      LEFT JOIN "AdminAckState" a
        ON a."adminUsername" = ${me.username}
       AND a."category" = 'properties.new'
       AND a."targetId" = p."id"
      WHERE p."deleted" = false
        AND p."id" NOT LIKE '%_child_%'
        AND (
          a."id" IS NULL
          OR GREATEST(p."updatedAt", p."createdAt") > a."acknowledgedAt"
        )
    `);

    const kycNewUnseenPromise = prisma.$queryRaw<Array<{ count: number }>>(Prisma.sql`
      SELECT COUNT(*)::int AS count
      FROM "User" u
      LEFT JOIN "AdminAckState" a
        ON a."adminUsername" = ${me.username}
       AND a."category" = 'kyc.new'
       AND a."targetId" = u."id"
      WHERE u."deleted" = false
        AND u."createdAt" >= ${since}::timestamptz
        AND u."verificationStatus" IN ('pending','verified','rejected')
        AND a."id" IS NULL
    `);
    const kycPendingPromise = prisma.$queryRaw<Array<{ count: number }>>(Prisma.sql`
      SELECT COUNT(*)::int AS count
      FROM "User" u
      WHERE u."deleted" = false
        AND u."verificationStatus" = 'pending'
    `);

    const kycVerifiedReviewPromise = prisma.$queryRaw<Array<{ count: number }>>(Prisma.sql`
      SELECT COUNT(*)::int AS count
      FROM "User" u
      WHERE u."deleted" = false
        AND u."verificationStatus" = 'verified'
    `);

    const contractsNewUnseenPromise = prisma.$queryRaw<Array<{ count: number }>>(Prisma.sql`
      SELECT COUNT(*)::int AS count
      FROM "Booking" b
      LEFT JOIN "AdminAckState" a
        ON a."adminUsername" = ${me.username}
       AND a."category" = 'contracts.new'
       AND a."targetId" = b."id"
      WHERE COALESCE(b."detailJson"->>'paymentStatus','') = 'paid'
        AND b."status" <> 'cancelled'
        AND (
          b."status" = 'completed'
          OR (
            b."status" = 'confirmed'
            AND b."checkOutDate" <= NOW()
          )
          OR (
            b."status" = 'confirmed'
            AND b."checkInDate" > NOW()
          )
          OR (
            b."status" = 'confirmed'
            AND b."checkInDate" <= NOW()
            AND b."checkOutDate" > NOW()
          )
        )
        AND COALESCE(b."updatedAt", b."createdAt") >= ${since}::timestamptz
        AND a."id" IS NULL
    `);

    const refundsNewUnseenPromise = prisma.$queryRaw<Array<{ count: number }>>(Prisma.sql`
      SELECT COUNT(*)::int AS count
      FROM "Booking" b
      LEFT JOIN "AdminAckState" a
        ON a."adminUsername" = ${me.username}
       AND a."category" = 'refunds.new'
       AND a."targetId" = b."id"
      WHERE b."status" = 'cancelled'
        AND COALESCE(b."detailJson"->>'paymentStatus','') = 'paid'
        AND COALESCE((b."detailJson"->>'refundAdminApproved')::boolean, false) = false
        AND COALESCE(
          NULLIF(b."detailJson"->>'cancelledAt', '')::timestamptz,
          b."updatedAt",
          b."createdAt"
        ) >= ${since}::timestamptz
        AND a."id" IS NULL
    `);

    /** 승인 요청 탭: 큐에 없고 · 미승인/미보류 · 요청 ack 없음 */
    const settlementsRequestUnseenPromise = prisma.$queryRaw<Array<{ count: number }>>(Prisma.sql`
      SELECT COUNT(*)::int AS count
      FROM "Booking" b
      INNER JOIN "Property" p ON p."id" = b."propertyId"
      LEFT JOIN "AdminSettlementApproval" s ON s."bookingId" = b."id"
      LEFT JOIN "AdminSettlementPendingQueue" q ON q."bookingId" = b."id"
      LEFT JOIN "AdminAckState" ar
        ON ar."adminUsername" = ${me.username}
       AND ar."category" = 'settlement.request'
       AND ar."targetId" = b."id"
      WHERE COALESCE(b."detailJson"->>'paymentStatus','') = 'paid'
        AND b."status" <> 'cancelled'
        AND (
          b."status" = 'completed'
          OR (b."status" = 'confirmed' AND b."checkOutDate" <= NOW())
        )
        AND (s."id" IS NULL OR COALESCE(s."status", '') NOT IN ('approved', 'held'))
        AND q."bookingId" IS NULL
        AND ar."id" IS NULL
    `);
    /** 승인 대기 탭: 큐에 있고 · 미승인/미보류 · 대기 ack 없음 */
    const settlementsPendingOnlyUnseenPromise = prisma.$queryRaw<Array<{ count: number }>>(Prisma.sql`
      SELECT COUNT(*)::int AS count
      FROM "Booking" b
      INNER JOIN "Property" p ON p."id" = b."propertyId"
      LEFT JOIN "AdminSettlementApproval" s ON s."bookingId" = b."id"
      LEFT JOIN "AdminSettlementPendingQueue" q ON q."bookingId" = b."id"
      LEFT JOIN "AdminAckState" ap
        ON ap."adminUsername" = ${me.username}
       AND ap."category" = 'settlement.pending'
       AND ap."targetId" = b."id"
      WHERE COALESCE(b."detailJson"->>'paymentStatus','') = 'paid'
        AND b."status" <> 'cancelled'
        AND (
          b."status" = 'completed'
          OR (b."status" = 'confirmed' AND b."checkOutDate" <= NOW())
        )
        AND (s."id" IS NULL OR COALESCE(s."status", '') NOT IN ('approved', 'held'))
        AND q."bookingId" IS NOT NULL
        AND ap."id" IS NULL
    `);
    const withdrawalsPendingPromise = prisma.$queryRaw<Array<{ count: number }>>(Prisma.sql`
      SELECT COUNT(*)::int AS count
      FROM "AdminWithdrawalRequest" w
      WHERE (CASE WHEN w."status" = 'approved' THEN 'processing' ELSE w."status" END) = 'pending'
    `);

    const auditModerationUnseenPromise = prisma.$queryRaw<Array<{ count: number }>>(Prisma.sql`
      SELECT COUNT(*)::int AS count
      FROM "AdminModerationAudit" m
      LEFT JOIN "AdminAckState" a
        ON a."adminUsername" = ${me.username}
       AND a."category" = 'audit.recent'
       AND a."targetId" = CONCAT('mod:', m."id")
      WHERE m."createdAt" >= ${since}::timestamptz
        AND a."id" IS NULL
    `);
    const auditLedgerUnseenPromise = prisma.$queryRaw<Array<{ count: number }>>(Prisma.sql`
      SELECT COUNT(*)::int AS count
      FROM "AdminFinanceLedger" l
      LEFT JOIN "AdminAckState" a
        ON a."adminUsername" = ${me.username}
       AND a."category" = 'audit.recent'
       AND a."targetId" = CONCAT('ledger:', l."id")
      WHERE l."createdAt" >= ${since}::timestamptz
        AND a."id" IS NULL
    `);

    const systemLogNewUnseenPromise = prisma.$queryRaw<Array<{ count: number }>>(Prisma.sql`
      SELECT COUNT(*)::int AS count
      FROM "AdminSystemLog" l
      LEFT JOIN "AdminAckState" a
        ON a."adminUsername" = ${me.username}
       AND a."category" = 'system-log.new'
       AND a."targetId" = l."id"
      WHERE l."ts" >= ${since}::timestamptz
        AND a."id" IS NULL
    `);

    const [
      usersNewUnseenRows,
      propertiesNewUnseenRows,
      kycNewUnseenRows,
      contractsNewUnseenRows,
      refundsNewUnseenRows,
      settlementsRequestUnseenRows,
      settlementsPendingOnlyUnseenRows,
      withdrawalsPendingRows,
      kycPendingRows,
      kycVerifiedReviewRows,
      auditModerationUnseenRows,
      auditLedgerUnseenRows,
      systemLogNewUnseenRows,
    ] = await Promise.all([
      usersNewUnseenPromise,
      propertiesNewUnseenPromise,
      kycNewUnseenPromise,
      contractsNewUnseenPromise,
      refundsNewUnseenPromise,
      settlementsRequestUnseenPromise,
      settlementsPendingOnlyUnseenPromise,
      withdrawalsPendingPromise,
      kycPendingPromise,
      kycVerifiedReviewPromise,
      auditModerationUnseenPromise,
      auditLedgerUnseenPromise,
      systemLogNewUnseenPromise,
    ]);

    const usersNewUnseenRow = usersNewUnseenRows[0];
    const propertiesNewUnseenRow = propertiesNewUnseenRows[0];
    const kycNewUnseenRow = kycNewUnseenRows[0];
    const contractsNewUnseenRow = contractsNewUnseenRows[0];
    const refundsNewUnseenRow = refundsNewUnseenRows[0];
    const settlementsRequestUnseenRow = settlementsRequestUnseenRows[0];
    const settlementsPendingOnlyUnseenRow = settlementsPendingOnlyUnseenRows[0];
    const withdrawalsPendingRow = withdrawalsPendingRows[0];
    const kycPendingRow = kycPendingRows[0];
    const kycVerifiedReviewRow = kycVerifiedReviewRows[0];
    const auditModerationUnseenRow = auditModerationUnseenRows[0];
    const auditLedgerUnseenRow = auditLedgerUnseenRows[0];
    const systemLogNewUnseenRow = systemLogNewUnseenRows[0];

    const settlementsPendingUnseen =
      (settlementsRequestUnseenRow?.count ?? 0) + (settlementsPendingOnlyUnseenRow?.count ?? 0);
    const auditRecent =
      (auditModerationUnseenRow?.count ?? 0) + (auditLedgerUnseenRow?.count ?? 0);

    return observeRouteResponse(
      NextResponse.json({
        usersNewUnseen: usersNewUnseenRow?.count ?? 0,
        propertiesNewUnseen: propertiesNewUnseenRow?.count ?? 0,
        kycNewUnseen: kycNewUnseenRow?.count ?? 0,
        contractsNewUnseen: contractsNewUnseenRow?.count ?? 0,
        refundsNewUnseen: refundsNewUnseenRow?.count ?? 0,
        settlementsPendingUnseen,
        withdrawalsPending: withdrawalsPendingRow?.count ?? 0,
        kycPending: kycPendingRow?.count ?? 0,
        kycVerifiedReview: kycVerifiedReviewRow?.count ?? 0,
        auditRecent,
        systemLogNewUnseen: systemLogNewUnseenRow?.count ?? 0,
      }),
      route,
      startedAt
    );
  } catch (error) {
    console.error('GET /api/admin/badge-counts', error);
    return observeRouteResponse(
      NextResponse.json({ error: 'database_unavailable' }, { status: 503 }),
      route,
      startedAt
    );
  }
}

