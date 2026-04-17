import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminFromRequest } from '@/lib/server/adminAuthServer';
import { Prisma } from '@prisma/client';

const ADMIN_NEW_MS = 24 * 60 * 60 * 1000;

function dayAgoIso(): string {
  return new Date(Date.now() - ADMIN_NEW_MS).toISOString();
}

export async function GET(request: NextRequest) {
  const me = await getAdminFromRequest(request);
  if (!me) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

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
        AND p."createdAt" >= ${since}::timestamptz
        AND a."id" IS NULL
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

    const settlementsPendingUnseenPromise = prisma.$queryRaw<Array<{ count: number }>>(Prisma.sql`
      SELECT COUNT(*)::int AS count
      FROM "Booking" b
      LEFT JOIN "AdminAckState" ap
        ON ap."adminUsername" = ${me.username}
       AND ap."category" = 'settlement.pending'
       AND ap."targetId" = b."id"
      LEFT JOIN "AdminAckState" ar
        ON ar."adminUsername" = ${me.username}
       AND ar."category" = 'settlement.request'
       AND ar."targetId" = b."id"
      WHERE COALESCE(b."detailJson"->>'paymentStatus','') = 'paid'
        AND b."status" <> 'cancelled'
        AND (
          b."status" = 'completed'
          OR (
            b."status" = 'confirmed'
            AND b."checkOutDate" <= NOW()
          )
        )
        AND ap."id" IS NULL
        AND ar."id" IS NULL
    `);
    const withdrawalsPendingPromise = prisma.$queryRaw<Array<{ count: number }>>(Prisma.sql`
      SELECT COUNT(*)::int AS count
      FROM "AdminWithdrawalRequest" w
      WHERE (CASE WHEN w."status" = 'approved' THEN 'processing' ELSE w."status" END) = 'pending'
    `);

    const auditRecentPromise = prisma.$queryRaw<Array<{ count: number }>>(Prisma.sql`
      SELECT COUNT(*)::int AS count
      FROM "AdminModerationAudit" m
      LEFT JOIN "AdminAckState" a
        ON a."adminUsername" = ${me.username}
       AND a."category" = 'audit.recent'
       AND a."targetId" = CONCAT('mod:', m."id")
      WHERE m."createdAt" >= ${since}::timestamptz
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
      settlementsPendingUnseenRows,
      withdrawalsPendingRows,
      kycPendingRows,
      kycVerifiedReviewRows,
      auditRecentRows,
      systemLogNewUnseenRows,
    ] = await Promise.all([
      usersNewUnseenPromise,
      propertiesNewUnseenPromise,
      kycNewUnseenPromise,
      contractsNewUnseenPromise,
      refundsNewUnseenPromise,
      settlementsPendingUnseenPromise,
      withdrawalsPendingPromise,
      kycPendingPromise,
      kycVerifiedReviewPromise,
      auditRecentPromise,
      systemLogNewUnseenPromise,
    ]);

    const usersNewUnseenRow = usersNewUnseenRows[0];
    const propertiesNewUnseenRow = propertiesNewUnseenRows[0];
    const kycNewUnseenRow = kycNewUnseenRows[0];
    const contractsNewUnseenRow = contractsNewUnseenRows[0];
    const refundsNewUnseenRow = refundsNewUnseenRows[0];
    const settlementsPendingUnseenRow = settlementsPendingUnseenRows[0];
    const withdrawalsPendingRow = withdrawalsPendingRows[0];
    const kycPendingRow = kycPendingRows[0];
    const kycVerifiedReviewRow = kycVerifiedReviewRows[0];
    const auditRecentRow = auditRecentRows[0];
    const systemLogNewUnseenRow = systemLogNewUnseenRows[0];

    return NextResponse.json({
      usersNewUnseen: usersNewUnseenRow?.count ?? 0,
      propertiesNewUnseen: propertiesNewUnseenRow?.count ?? 0,
      kycNewUnseen: kycNewUnseenRow?.count ?? 0,
      contractsNewUnseen: contractsNewUnseenRow?.count ?? 0,
      refundsNewUnseen: refundsNewUnseenRow?.count ?? 0,
      settlementsPendingUnseen: settlementsPendingUnseenRow?.count ?? 0,
      withdrawalsPending: withdrawalsPendingRow?.count ?? 0,
      kycPending: kycPendingRow?.count ?? 0,
      kycVerifiedReview: kycVerifiedReviewRow?.count ?? 0,
      auditRecent: auditRecentRow?.count ?? 0,
      systemLogNewUnseen: systemLogNewUnseenRow?.count ?? 0,
    });
  } catch (error) {
    console.error('GET /api/admin/badge-counts', error);
    return NextResponse.json({ error: 'database_unavailable' }, { status: 503 });
  }
}

