import {
  isPaidStatus,
  type BookingTransitionTx,
  transitionBookingOnPaymentUpdate,
} from '@/lib/server/bookingPaymentTransition';

/** 동일 idempotencyKey로 상충하는 결제 PATCH 재시도 */
export class PaymentPatchIdempotencyConflictError extends Error {
  override readonly name = 'PaymentPatchIdempotencyConflictError';
  constructor() {
    super('Idempotency key reused with incompatible payment state');
  }
}

export type PaymentRowSnapshot = {
  id: string;
  status: string;
  idempotencyKey: string | null;
};

type TransitionResult = {
  bookingConfirmed: boolean;
  bookingCancelled: boolean;
};

/**
 * 결제 확정 PATCH 멱등 처리.
 * - 키 일치 + 이미 paid: 예약만 pending이면 전이만 재시도(부분 실패 복구), 아니면 DB 상태로 응답만 반환.
 * - 키 일치 + 이미 paid인데 클라이언트가 paid가 아닌 status로 바꾸려 하면 충돌.
 */
export async function resolvePaymentPatchIdempotency(args: {
  tx: BookingTransitionTx;
  idempotencyKey: string;
  normalizedPaymentStatus: string | null;
  refundStatus: string | null | undefined;
  bookingId: string;
  pay: PaymentRowSnapshot;
  lockedBookingStatus: string;
  /** 결제는 paid인데 예약이 아직 pending일 때 전이 직전 재검증(겹침·레이스) */
  beforePendingPaidRecover?: () => Promise<void>;
}): Promise<
  | { action: 'continue' }
  | { action: 'return'; transition: TransitionResult }
  | { action: 'recover_transition'; transition: TransitionResult }
> {
  const idem = args.idempotencyKey.trim();
  if (!idem || args.pay.idempotencyKey !== idem) {
    return { action: 'continue' };
  }

  const wantsPaid = isPaidStatus(args.normalizedPaymentStatus);
  const rowPaid = isPaidStatus(args.pay.status);

  if (rowPaid && args.normalizedPaymentStatus !== null && !wantsPaid) {
    throw new PaymentPatchIdempotencyConflictError();
  }

  if (!rowPaid) {
    return { action: 'continue' };
  }

  if (args.lockedBookingStatus === 'confirmed') {
    return {
      action: 'return',
      transition: { bookingConfirmed: true, bookingCancelled: false },
    };
  }

  if (args.beforePendingPaidRecover) {
    await args.beforePendingPaidRecover();
  }

  const transition = await transitionBookingOnPaymentUpdate(args.tx, {
    bookingId: args.bookingId,
    paymentStatus: args.pay.status,
    refundStatus:
      args.refundStatus !== undefined ? args.refundStatus : null,
  });

  return {
    action: 'recover_transition',
    transition,
  };
}
