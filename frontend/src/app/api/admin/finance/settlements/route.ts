import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminFromRequest } from '@/lib/server/adminAuthServer';
import { observeRouteResponse } from '@/lib/server/apiMonitoring';
import {
  SETTLEMENT_DB_REASON_HOLD_APPROVED_CASE,
  SETTLEMENT_DB_REASON_HOLD_PENDING_CASE,
  SETTLEMENT_DB_REASON_HOLD_POST_APPROVAL,
  SETTLEMENT_DB_REASON_HOLD_PRE_APPROVAL,
} from '@/lib/adminSettlementDbReasons';
import { bumpBookingUpdatedAtForDomainSignal } from '@/lib/server/bumpBookingDomainSignal';

type SettlementCandidateRow = {
  bookingId: string;
  ownerId: string;
  propertyTitle: string | null;
  propertyAddress: string | null;
  checkInDate: Date;
  checkOutDate: Date;
  checkInTime: string | null;
  checkOutTime: string | null;
  amount: number;
  approvalStatus: string | null;
  inPendingQueue: boolean;
};

function toCandidate(row: SettlementCandidateRow) {
  return {
    bookingId: row.bookingId,
    ownerId: row.ownerId,
    propertyTitle: row.propertyTitle || '',
    propertyAddress: row.propertyAddress || undefined,
    checkInDate: new Date(row.checkInDate).toISOString(),
    checkOutDate: new Date(row.checkOutDate).toISOString(),
    checkInTime: row.checkInTime || '14:00',
    checkOutTime: row.checkOutTime || '12:00',
    amount: Number(row.amount || 0),
    approvalStatus: (row.approvalStatus as 'approved' | 'held' | null) ?? null,
    approved: row.approvalStatus === 'approved',
    inPendingQueue: Boolean(row.inPendingQueue),
  };
}

export async function GET(request: NextRequest) {
  const startedAt = Date.now();
  const route = 'GET /api/admin/finance/settlements';
  const me = await getAdminFromRequest(request);
  if (!me)
    return observeRouteResponse(NextResponse.json({ error: 'unauthorized' }, { status: 401 }), route, startedAt);
  try {
    const rows = await prisma.$queryRawUnsafe<SettlementCandidateRow[]>(
      `
      SELECT
        b."id" AS "bookingId",
        b."propertyId" AS "propertyId",
        p."ownerId" AS "ownerId",
        COALESCE(NULLIF(b."detailJson"->>'propertyTitle', ''), p."title") AS "propertyTitle",
        COALESCE(NULLIF(b."detailJson"->>'propertyAddress', ''), p."address") AS "propertyAddress",
        b."checkInDate",
        b."checkOutDate",
        NULLIF(b."detailJson"->>'checkInTime', '') AS "checkInTime",
        NULLIF(b."detailJson"->>'checkOutTime', '') AS "checkOutTime",
        COALESCE((b."detailJson"->>'totalPrice')::float8, b."totalPrice", 0) AS "amount",
        s."status" AS "approvalStatus",
        CASE WHEN q."bookingId" IS NULL THEN false ELSE true END AS "inPendingQueue"
      FROM "Booking" b
      INNER JOIN "Property" p ON p."id" = b."propertyId"
      LEFT JOIN "AdminSettlementApproval" s ON s."bookingId" = b."id"
      LEFT JOIN "AdminSettlementPendingQueue" q ON q."bookingId" = b."id"
      WHERE COALESCE(b."detailJson"->>'paymentStatus', '') = 'paid'
        AND b."status" <> 'cancelled'
        AND (
          b."status" = 'completed'
          OR (b."status" = 'confirmed' AND b."checkOutDate" <= NOW())
        )
      ORDER BY b."updatedAt" DESC
      `
    );
    return observeRouteResponse(
      NextResponse.json({ candidates: rows.map(toCandidate) }),
      route,
      startedAt
    );
  } catch (error) {
    console.error('GET /api/admin/finance/settlements', error);
    return observeRouteResponse(
      NextResponse.json({ error: 'database_unavailable' }, { status: 503 }),
      route,
      startedAt
    );
  }
}

export async function PATCH(request: NextRequest) {
  const startedAt = Date.now();
  const route = 'PATCH /api/admin/finance/settlements';
  const me = await getAdminFromRequest(request);
  if (!me)
    return observeRouteResponse(NextResponse.json({ error: 'unauthorized' }, { status: 401 }), route, startedAt);
  let body: {
    action?: 'move_to_pending' | 'hold_pending' | 'approve' | 'hold_approved' | 'resume_pending' | 'resume_request';
    bookingId?: string;
    ownerId?: string;
    amount?: number;
    reason?: string;
  };
  try {
    body = await request.json();
  } catch {
    return observeRouteResponse(
      NextResponse.json({ error: 'invalid_body' }, { status: 400 }),
      route,
      startedAt
    );
  }
  const bookingId = String(body.bookingId || '').trim();
  const action = body.action;
  const ownerId = String(body.ownerId || '').trim();
  const amount = Number(body.amount || 0);
  const reason = String(body.reason || '').trim() || null;
  if (!bookingId || !action)
    return observeRouteResponse(
      NextResponse.json({ error: 'invalid_input' }, { status: 400 }),
      route,
      startedAt
    );

  try {
    await prisma.$transaction(async (tx) => {
      if (action === 'move_to_pending') {
        await tx.$executeRawUnsafe(
          `INSERT INTO "AdminSettlementPendingQueue" ("bookingId","createdAt") VALUES ($1,NOW()) ON CONFLICT ("bookingId") DO NOTHING`,
          bookingId
        );
        return;
      }

      if (action === 'hold_pending') {
        if (!ownerId || !Number.isFinite(amount)) throw new Error('invalid_payload');
        await tx.$executeRawUnsafe(
          `
          INSERT INTO "AdminSettlementApproval"
            ("id","bookingId","ownerId","amount","status","approvedBy","approvedAt","reason","createdAt","updatedAt")
          VALUES ($1,$2,$3,$4,'held',$5,NOW(),$6,NOW(),NOW())
          ON CONFLICT ("bookingId")
          DO UPDATE SET
            "ownerId" = EXCLUDED."ownerId",
            "amount" = EXCLUDED."amount",
            "status" = 'held',
            "approvedBy" = EXCLUDED."approvedBy",
            "approvedAt" = NOW(),
            "reason" = EXCLUDED."reason",
            "updatedAt" = NOW()
          `,
          crypto.randomUUID(),
          bookingId,
          ownerId,
          amount,
          me.username,
          reason || SETTLEMENT_DB_REASON_HOLD_PRE_APPROVAL
        );
        await tx.$executeRawUnsafe(`DELETE FROM "AdminSettlementPendingQueue" WHERE "bookingId" = $1`, bookingId);
        await tx.$executeRawUnsafe(
          `
          INSERT INTO "AdminFinanceLedger" ("id","ownerId","amount","type","refId","note","createdBy","createdAt")
          VALUES ($1,$2,0,'settlement_held',$3,$4,$5,NOW())
          `,
          crypto.randomUUID(),
          ownerId,
          bookingId,
          reason || SETTLEMENT_DB_REASON_HOLD_PENDING_CASE,
          me.username
        );
        return;
      }

      if (action === 'approve') {
        if (!ownerId || !Number.isFinite(amount)) throw new Error('invalid_payload');
        await tx.$executeRawUnsafe(
          `
          INSERT INTO "AdminSettlementApproval"
            ("id","bookingId","ownerId","amount","status","approvedBy","approvedAt","createdAt","updatedAt")
          VALUES ($1,$2,$3,$4,'approved',$5,NOW(),NOW(),NOW())
          ON CONFLICT ("bookingId")
          DO UPDATE SET
            "ownerId" = EXCLUDED."ownerId",
            "amount" = EXCLUDED."amount",
            "status" = 'approved',
            "approvedBy" = EXCLUDED."approvedBy",
            "approvedAt" = NOW(),
            "updatedAt" = NOW()
          `,
          crypto.randomUUID(),
          bookingId,
          ownerId,
          amount,
          me.username
        );
        await tx.$executeRawUnsafe(`DELETE FROM "AdminSettlementPendingQueue" WHERE "bookingId" = $1`, bookingId);
        await tx.$executeRawUnsafe(
          `
          INSERT INTO "AdminFinanceLedger" ("id","ownerId","amount","type","refId","note","createdBy","createdAt")
          VALUES ($1,$2,$3,'settlement_approved',$4,'Settlement approved by admin',$5,NOW())
          `,
          crypto.randomUUID(),
          ownerId,
          amount,
          bookingId,
          me.username
        );
        return;
      }

      if (action === 'hold_approved') {
        await tx.$executeRawUnsafe(
          `
          UPDATE "AdminSettlementApproval"
          SET "status" = 'held', "reason" = $1, "approvedBy" = $2, "approvedAt" = NOW(), "updatedAt" = NOW()
          WHERE "bookingId" = $3 AND "status" = 'approved'
          `,
          reason || SETTLEMENT_DB_REASON_HOLD_POST_APPROVAL,
          me.username,
          bookingId
        );
        const rows = await tx.$queryRawUnsafe<Array<{ ownerId: string }>>(
          `SELECT "ownerId" FROM "AdminSettlementApproval" WHERE "bookingId" = $1 LIMIT 1`,
          bookingId
        );
        const row = rows[0];
        if (row) {
          await tx.$executeRawUnsafe(
            `
            INSERT INTO "AdminFinanceLedger" ("id","ownerId","amount","type","refId","note","createdBy","createdAt")
            VALUES ($1,$2,0,'settlement_held',$3,$4,$5,NOW())
            `,
            crypto.randomUUID(),
            row.ownerId,
            bookingId,
            reason || SETTLEMENT_DB_REASON_HOLD_APPROVED_CASE,
            me.username
          );
        }
        return;
      }

      if (action === 'resume_pending' || action === 'resume_request') {
        const rows = await tx.$queryRawUnsafe<Array<{ ownerId: string; amount: number }>>(
          `SELECT "ownerId","amount" FROM "AdminSettlementApproval" WHERE "bookingId" = $1 AND "status" = 'held' LIMIT 1`,
          bookingId
        );
        const row = rows[0];
        if (!row) throw new Error('not_found');
        await tx.$executeRawUnsafe(`DELETE FROM "AdminSettlementApproval" WHERE "bookingId" = $1`, bookingId);
        if (action === 'resume_pending') {
          await tx.$executeRawUnsafe(
            `INSERT INTO "AdminSettlementPendingQueue" ("bookingId","createdAt") VALUES ($1,NOW()) ON CONFLICT ("bookingId") DO NOTHING`,
            bookingId
          );
          await tx.$executeRawUnsafe(
            `
            INSERT INTO "AdminFinanceLedger" ("id","ownerId","amount","type","refId","note","createdBy","createdAt")
            VALUES ($1,$2,0,'settlement_reverted_pending',$3,$4,$5,NOW())
            `,
            crypto.randomUUID(),
            row.ownerId,
            bookingId,
            `Hold released → restored to approval pending (amount ${row.amount.toLocaleString('en-US')} VND; re-approval required)`,
            me.username
          );
        } else {
          await tx.$executeRawUnsafe(`DELETE FROM "AdminSettlementPendingQueue" WHERE "bookingId" = $1`, bookingId);
          await tx.$executeRawUnsafe(
            `
            INSERT INTO "AdminFinanceLedger" ("id","ownerId","amount","type","refId","note","createdBy","createdAt")
            VALUES ($1,$2,0,'settlement_reverted_request',$3,$4,$5,NOW())
            `,
            crypto.randomUUID(),
            row.ownerId,
            bookingId,
            `Hold released → restored to approval request (amount ${row.amount.toLocaleString('en-US')} VND; review then move to pending)`,
            me.username
          );
        }
        return;
      }

      throw new Error('unsupported_action');
    });

    await bumpBookingUpdatedAtForDomainSignal(bookingId);

    return observeRouteResponse(NextResponse.json({ ok: true }), route, startedAt);
  } catch (error) {
    if (error instanceof Error && (error.message === 'not_found' || error.message === 'invalid_payload')) {
      return observeRouteResponse(
        NextResponse.json({ error: error.message }, { status: 400 }),
        route,
        startedAt
      );
    }
    console.error('PATCH /api/admin/finance/settlements', error);
    return observeRouteResponse(
      NextResponse.json({ error: 'database_unavailable' }, { status: 503 }),
      route,
      startedAt
    );
  }
}
