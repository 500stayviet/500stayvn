import { createHash, randomUUID } from 'node:crypto';
import type { PrismaClient } from '@prisma/client';
import { prisma as prismaDefault, type AppPrismaClient } from '@/lib/prisma';
import {
  type BookingTransitionTx,
  isPaidStatus,
  transitionBookingOnPaymentUpdate,
} from '@/lib/server/bookingPaymentTransition';
import {
  assertNoOverlapWithConfirmedBookings,
  BookingNotFoundInTransactionError,
  lockBookingRowForUpdate,
  PaymentRowMissingInTransactionError,
} from '@/lib/server/paymentConfirmAvailability';
import {
  resolvePaymentPatchIdempotency,
  type PaymentRowSnapshot,
} from '@/lib/server/paymentPatchIdempotency';

/** PATCH 멱등 키 계약과 합류: `SECURITY_APP_API_CHECKLIST.md` — 웹훅 트랜잭션 앵커(transId). */
export const MOMO_IPN_IDEMPOTENCY_PREFIX = 'momo-ipn:';

export function momoWebhookIdempotencyKey(transId: string): string {
  return `${MOMO_IPN_IDEMPOTENCY_PREFIX}${transId.trim()}`;
}

/** 로그용 — orderId/transId 원문 노출 금지. */
export function hashForWebhookLog(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex').slice(0, 16);
}

function pickPaymentSnapshot(pay: Record<string, unknown>): PaymentRowSnapshot | null {
  const id = pay.id;
  const status = pay.status;
  const ik = pay.idempotencyKey;
  if (typeof id !== 'string' || typeof status !== 'string') return null;
  return {
    id,
    status,
    idempotencyKey: ik === null || typeof ik === 'string' ? ik : null,
  };
}

/** MoMo V3 성공 결과 코드는 0. */
export function momoResultIsSuccess(resultCode: unknown): boolean {
  if (typeof resultCode === 'number' && Number.isFinite(resultCode)) {
    return resultCode === 0;
  }
  const s = String(resultCode ?? '').trim();
  if (s === '') return false;
  const n = Number(s);
  return Number.isFinite(n) && n === 0;
}

function parseMomoAmount(amount: unknown): number | null {
  if (typeof amount === 'number' && Number.isFinite(amount)) return amount;
  if (typeof amount === 'string') {
    const n = parseFloat(amount.trim());
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function amountMatchesRecord(recordAmount: number, momoAmount: number): boolean {
  return Math.round(Math.abs(recordAmount - momoAmount)) <= 1;
}

export class MomoIpnAmountMismatchError extends Error {
  override readonly name = 'MomoIpnAmountMismatchError';
  constructor() {
    super('MoMo IPN amount does not match PaymentRecord');
  }
}

export type MomoIpnApplyOptions = {
  /** 통합 테스트 등: 다른 DB URL의 PrismaClient. 생략 시 앱 단일턴 prisma. */
  prisma?: PrismaClient;
};

export type MomoIpnApplyResult =
  | { outcome: 'not_found' }
  | { outcome: 'duplicate' }
  | { outcome: 'applied'; transitionPaid: boolean };

/**
 * 서명 검증이 끝난 MoMo IPN 본문을 원장에 반영한다.
 * — `PATCH /api/app/payments/[bookingId]` 와 동일한 잠금·`resolvePaymentPatchIdempotency`·`transitionBookingOnPaymentUpdate` 규약.
 * — `PaymentRecord.externalPaymentId` 는 MoMo `orderId` 와 동일해야 조회된다(결제 생성 시 설정).
 */
export async function applyVerifiedMomoIpn(
  payload: {
    orderId: string;
    transId: string;
    resultCode: unknown;
    amount?: unknown;
  },
  options?: MomoIpnApplyOptions,
): Promise<MomoIpnApplyResult> {
  const db = (options?.prisma ?? prismaDefault) as AppPrismaClient;
  const orderId = payload.orderId.trim();
  const transId = payload.transId.trim();
  if (!orderId || !transId) {
    return { outcome: 'not_found' };
  }

  const success = momoResultIsSuccess(payload.resultCode);
  const amountParsed = payload.amount !== undefined ? parseMomoAmount(payload.amount) : null;

  const prelude = await db.$queryRawUnsafe<Array<{ id: string; bookingId: string }>>(
    `
    SELECT id, "bookingId"
    FROM "PaymentRecord"
    WHERE "externalPaymentId" = $1
    ORDER BY "createdAt" DESC
    LIMIT 1
    `,
    orderId
  );
  if (!prelude[0]) {
    return { outcome: 'not_found' };
  }
  const paymentId = prelude[0].id;
  const bookingId = prelude[0].bookingId;

  const txResult = await db.$transaction(async (tx) => {
    const locked = await lockBookingRowForUpdate(tx, bookingId);
    if (!locked) {
      throw new BookingNotFoundInTransactionError(bookingId);
    }

    const payLockedRows = await tx.$queryRawUnsafe<Record<string, unknown>[]>(
      `
      SELECT * FROM "PaymentRecord"
      WHERE "id" = $1
      FOR UPDATE
      `,
      paymentId
    );
    const payFull = payLockedRows[0];
    if (!payFull) {
      throw new BookingNotFoundInTransactionError(bookingId);
    }
    if (String(payFull.externalPaymentId ?? '').trim() !== orderId) {
      throw new PaymentRowMissingInTransactionError();
    }

    const paySnap = pickPaymentSnapshot(payFull);
    if (!paySnap) throw new PaymentRowMissingInTransactionError();

    const idemKey = momoWebhookIdempotencyKey(transId);

    const receiptRows = await tx.$queryRawUnsafe<{ id: string }[]>(
      `
      INSERT INTO "MomoIpnReceipt" ("id","transId","paymentRecordId","orderId","createdAt")
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT ("transId") DO NOTHING
      RETURNING "id"
      `,
      randomUUID(),
      transId,
      paymentId,
      orderId
    );
    if (!receiptRows[0]) {
      return { kind: 'duplicate' as const };
    }

    const normalizedStatus = success ? 'paid' : 'failed';

    const idem = await resolvePaymentPatchIdempotency({
      tx: tx as unknown as BookingTransitionTx,
      idempotencyKey: idemKey,
      normalizedPaymentStatus: normalizedStatus,
      refundStatus: null,
      bookingId,
      pay: paySnap,
      lockedBookingStatus: locked.status,
      beforePendingPaidRecover:
        success && isPaidStatus(normalizedStatus) && locked.status === 'pending'
          ? async () => {
              await assertNoOverlapWithConfirmedBookings(tx, {
                bookingId,
                propertyId: locked.propertyId,
                checkInDate: locked.checkInDate,
                checkOutDate: locked.checkOutDate,
              });
            }
          : undefined,
    });

    if (idem.action === 'return' || idem.action === 'recover_transition') {
      return {
        kind: 'ok' as const,
        transitionPaid: idem.transition.bookingConfirmed,
      };
    }

    if (success) {
      if (amountParsed === null) {
        throw new MomoIpnAmountMismatchError();
      }
      if (!amountMatchesRecord(Number(payFull.amount), amountParsed)) {
        throw new MomoIpnAmountMismatchError();
      }
    }

    if (success && isPaidStatus(normalizedStatus) && locked.status === 'pending') {
      await assertNoOverlapWithConfirmedBookings(tx, {
        bookingId,
        propertyId: locked.propertyId,
        checkInDate: locked.checkInDate,
        checkOutDate: locked.checkOutDate,
      });
    }

    const prevMeta =
      typeof payFull.metaJson === 'object' &&
      payFull.metaJson !== null &&
      !Array.isArray(payFull.metaJson)
        ? (payFull.metaJson as Record<string, unknown>)
        : {};

    await tx.$queryRawUnsafe(
      `
      UPDATE "PaymentRecord"
      SET
        "status" = $2,
        "provider" = $3,
        "externalPaymentId" = $4,
        "idempotencyKey" = $5,
        "webhookEventId" = $6,
        "metaJson" = $7::jsonb,
        "updatedAt" = NOW()
      WHERE "id" = $1
      `,
      paymentId,
      normalizedStatus,
      'momo',
      orderId,
      idemKey,
      transId,
      JSON.stringify({
        ...prevMeta,
        momoIpn: {
          resultCode: payload.resultCode,
          appliedAt: new Date().toISOString(),
        },
      })
    );

    const transition = await transitionBookingOnPaymentUpdate(tx as unknown as BookingTransitionTx, {
      bookingId,
      paymentStatus: normalizedStatus,
      refundStatus: null,
    });

    return {
      kind: 'ok' as const,
      transitionPaid: transition.bookingConfirmed,
    };
  });

  if (txResult.kind === 'duplicate') {
    return { outcome: 'duplicate' };
  }
  return { outcome: 'applied', transitionPaid: txResult.transitionPaid };
}
