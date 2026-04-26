import { beforeEach, describe, expect, it, vi } from "vitest";
import type { BookingTransitionTx } from "./bookingPaymentTransition";
import { transitionBookingOnPaymentUpdate } from "./bookingPaymentTransition";
import {
  PaymentPatchIdempotencyConflictError,
  resolvePaymentPatchIdempotency,
} from "./paymentPatchIdempotency";

vi.mock("./bookingPaymentTransition", async (importOriginal) => {
  const mod = await importOriginal<typeof import("./bookingPaymentTransition")>();
  return {
    ...mod,
    transitionBookingOnPaymentUpdate: vi.fn(),
  };
});

const tx = {} as BookingTransitionTx;

const baseArgs = {
  tx,
  bookingId: "booking-1",
  pay: {
    id: "pay-1",
    status: "paid",
    idempotencyKey: "idem-abc",
  } as const,
};

describe("resolvePaymentPatchIdempotency", () => {
  beforeEach(() => {
    vi.mocked(transitionBookingOnPaymentUpdate).mockReset();
  });

  it("continue: 빈 키(공백만)는 멱등 분기 없음", async () => {
    const r = await resolvePaymentPatchIdempotency({
      ...baseArgs,
      idempotencyKey: "   ",
      normalizedPaymentStatus: "paid",
      refundStatus: null,
      lockedBookingStatus: "confirmed",
    });
    expect(r).toEqual({ action: "continue" });
    expect(transitionBookingOnPaymentUpdate).not.toHaveBeenCalled();
  });

  it("continue: 저장된 키와 요청 키가 다르면 일반 PATCH 경로", async () => {
    const r = await resolvePaymentPatchIdempotency({
      ...baseArgs,
      idempotencyKey: "other-key",
      normalizedPaymentStatus: "paid",
      refundStatus: null,
      lockedBookingStatus: "pending",
    });
    expect(r).toEqual({ action: "continue" });
    expect(transitionBookingOnPaymentUpdate).not.toHaveBeenCalled();
  });

  it("continue: 행이 아직 paid가 아니면 첫 확정 처리로 진행", async () => {
    const r = await resolvePaymentPatchIdempotency({
      ...baseArgs,
      pay: { id: "pay-1", status: "pending", idempotencyKey: "idem-abc" },
      idempotencyKey: "idem-abc",
      normalizedPaymentStatus: "paid",
      refundStatus: null,
      lockedBookingStatus: "pending",
    });
    expect(r).toEqual({ action: "continue" });
    expect(transitionBookingOnPaymentUpdate).not.toHaveBeenCalled();
  });

  it("충돌: 이미 paid인데 본문에서 failed 등으로 내리려 하면 예외", async () => {
    await expect(
      resolvePaymentPatchIdempotency({
        ...baseArgs,
        idempotencyKey: "idem-abc",
        normalizedPaymentStatus: "failed",
        refundStatus: null,
        lockedBookingStatus: "confirmed",
      }),
    ).rejects.toBeInstanceOf(PaymentPatchIdempotencyConflictError);
    expect(transitionBookingOnPaymentUpdate).not.toHaveBeenCalled();
  });

  it("return: 키 일치 + paid + 예약 이미 confirmed → UPDATE 없이 성공 전이만 반환", async () => {
    const before = vi.fn(async () => {});
    const r = await resolvePaymentPatchIdempotency({
      ...baseArgs,
      idempotencyKey: "idem-abc",
      normalizedPaymentStatus: "paid",
      refundStatus: null,
      lockedBookingStatus: "confirmed",
      beforePendingPaidRecover: before,
    });
    expect(r).toEqual({
      action: "return",
      transition: { bookingConfirmed: true, bookingCancelled: false },
    });
    expect(before).not.toHaveBeenCalled();
    expect(transitionBookingOnPaymentUpdate).not.toHaveBeenCalled();
  });

  it("recover: 키 일치 + paid + 예약 pending → 겹침 가드 후 예약 전이만 재시도", async () => {
    vi.mocked(transitionBookingOnPaymentUpdate).mockResolvedValue({
      bookingConfirmed: true,
      bookingCancelled: false,
    });
    const before = vi.fn(async () => {});

    const r = await resolvePaymentPatchIdempotency({
      ...baseArgs,
      idempotencyKey: "idem-abc",
      normalizedPaymentStatus: "completed",
      refundStatus: "none",
      lockedBookingStatus: "pending",
      beforePendingPaidRecover: before,
    });

    expect(before).toHaveBeenCalledTimes(1);
    expect(transitionBookingOnPaymentUpdate).toHaveBeenCalledTimes(1);
    expect(transitionBookingOnPaymentUpdate).toHaveBeenCalledWith(tx, {
      bookingId: "booking-1",
      paymentStatus: "paid",
      refundStatus: "none",
    });
    expect(r).toEqual({
      action: "recover_transition",
      transition: { bookingConfirmed: true, bookingCancelled: false },
    });
  });

  it("recover: beforePendingPaidRecover 생략 시에도 전이 호출", async () => {
    vi.mocked(transitionBookingOnPaymentUpdate).mockResolvedValue({
      bookingConfirmed: false,
      bookingCancelled: false,
    });

    const r = await resolvePaymentPatchIdempotency({
      ...baseArgs,
      idempotencyKey: "idem-abc",
      normalizedPaymentStatus: null,
      refundStatus: undefined,
      lockedBookingStatus: "pending",
    });

    expect(transitionBookingOnPaymentUpdate).toHaveBeenCalledWith(tx, {
      bookingId: "booking-1",
      paymentStatus: "paid",
      refundStatus: null,
    });
    expect(r).toEqual({
      action: "recover_transition",
      transition: { bookingConfirmed: false, bookingCancelled: false },
    });
  });

  it("normalizedPaymentStatus가 null이면 paid 다운그레이드로 보지 않아 충돌 없음", async () => {
    const before = vi.fn(async () => {});
    vi.mocked(transitionBookingOnPaymentUpdate).mockResolvedValue({
      bookingConfirmed: true,
      bookingCancelled: false,
    });

    await resolvePaymentPatchIdempotency({
      ...baseArgs,
      idempotencyKey: "idem-abc",
      normalizedPaymentStatus: null,
      refundStatus: null,
      lockedBookingStatus: "pending",
      beforePendingPaidRecover: before,
    });

    expect(before).toHaveBeenCalledTimes(1);
    expect(transitionBookingOnPaymentUpdate).toHaveBeenCalled();
  });
});
