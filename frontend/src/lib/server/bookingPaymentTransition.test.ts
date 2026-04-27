import { describe, expect, it, vi } from "vitest";
import {
  type BookingTransitionTx,
  isPaidStatus,
  transitionBookingOnPaymentUpdate,
} from "./bookingPaymentTransition";

type MockBookingRecord = {
  id: string;
  status: string;
  detailJson: Record<string, unknown> | null;
};

type BookingUpdateCall = {
  where: { id: string };
  data: Record<string, unknown>;
};

function detailOf(payload: BookingUpdateCall): Record<string, unknown> {
  const d = payload.data.detailJson;
  return typeof d === "object" && d !== null ? (d as Record<string, unknown>) : {};
}

function makeTx(record: MockBookingRecord | null) {
  const update = vi.fn(async (args: BookingUpdateCall) => {
    const { data } = args;
    return {
      id: record?.id ?? "missing",
      status: (data?.status as string | undefined) ?? record?.status,
      detailJson: (data?.detailJson as Record<string, unknown> | undefined) ?? record?.detailJson,
    };
  });
  const findUnique = vi.fn(async () => record);
  return {
    tx: {
      booking: {
        findUnique,
        update,
      },
    },
    findUnique,
    update,
  };
}

describe("isPaidStatus", () => {
  it("인식: paid, succeeded, success, completed (대소문자 무시)", () => {
    expect(isPaidStatus("paid")).toBe(true);
    expect(isPaidStatus("SUCCEEDED")).toBe(true);
    expect(isPaidStatus(" Success ")).toBe(true);
    expect(isPaidStatus("completed")).toBe(true);
  });

  it("비인식: pending, failed, partial", () => {
    expect(isPaidStatus("pending")).toBe(false);
    expect(isPaidStatus("failed")).toBe(false);
    expect(isPaidStatus("partial")).toBe(false);
    expect(isPaidStatus(null)).toBe(false);
    expect(isPaidStatus(undefined)).toBe(false);
  });
});

describe("transitionBookingOnPaymentUpdate", () => {
  it("confirms pending booking when payment is paid", async () => {
    const { tx, update } = makeTx({
      id: "b-1",
      status: "pending",
      detailJson: { guestId: "u-1" },
    });

    const result = await transitionBookingOnPaymentUpdate(tx as unknown as BookingTransitionTx, {
      bookingId: "b-1",
      paymentStatus: "paid",
      refundStatus: null,
    });

    expect(result).toEqual({ bookingConfirmed: true, bookingCancelled: false });
    expect(update).toHaveBeenCalledTimes(1);
    const payload = update.mock.calls[0]?.[0];
    expect(payload.where.id).toBe("b-1");
    expect(payload.data.status).toBe("confirmed");
    expect(detailOf(payload).status).toBe("confirmed");
    expect(detailOf(payload).paymentStatus).toBe("paid");
    expect(typeof detailOf(payload).confirmedAt).toBe("string");
  });

  it("confirms when payment status alias is succeeded", async () => {
    const { tx, update } = makeTx({
      id: "b-succ",
      status: "pending",
      detailJson: {},
    });
    const result = await transitionBookingOnPaymentUpdate(tx as unknown as BookingTransitionTx, {
      bookingId: "b-succ",
      paymentStatus: "succeeded",
      refundStatus: null,
    });
    expect(result).toEqual({ bookingConfirmed: true, bookingCancelled: false });
    expect(update).toHaveBeenCalledTimes(1);
  });

  it("does not confirm when payment is only pending", async () => {
    const { tx, update } = makeTx({
      id: "b-pend-pay",
      status: "pending",
      detailJson: {},
    });
    const result = await transitionBookingOnPaymentUpdate(tx as unknown as BookingTransitionTx, {
      bookingId: "b-pend-pay",
      paymentStatus: "pending",
      refundStatus: null,
    });
    expect(result).toEqual({ bookingConfirmed: false, bookingCancelled: false });
    expect(update).not.toHaveBeenCalled();
  });

  it("does not confirm when paymentStatus null (부분 PATCH)", async () => {
    const { tx, update } = makeTx({
      id: "b-null-pay",
      status: "pending",
      detailJson: {},
    });
    const result = await transitionBookingOnPaymentUpdate(tx as unknown as BookingTransitionTx, {
      bookingId: "b-null-pay",
      paymentStatus: null,
      refundStatus: null,
    });
    expect(result).toEqual({ bookingConfirmed: false, bookingCancelled: false });
    expect(update).not.toHaveBeenCalled();
  });

  it("refund_completed 로 pending 예약 취소 전이", async () => {
    const { tx, update } = makeTx({
      id: "b-rc",
      status: "pending",
      detailJson: { guestId: "g1" },
    });
    const result = await transitionBookingOnPaymentUpdate(tx as unknown as BookingTransitionTx, {
      bookingId: "b-rc",
      paymentStatus: "paid",
      refundStatus: "refund_completed",
    });
    expect(result).toEqual({ bookingConfirmed: false, bookingCancelled: true });
    expect(update).toHaveBeenCalledTimes(1);
    const payload = update.mock.calls[0]?.[0];
    expect(payload.data.status).toBe("cancelled_before");
  });

  it("이미 cancelled_before 이면 환불 PATCH 는 무변경", async () => {
    const { tx, update } = makeTx({
      id: "b-cb",
      status: "cancelled_before",
      detailJson: { guestId: "g1" },
    });
    const result = await transitionBookingOnPaymentUpdate(tx as unknown as BookingTransitionTx, {
      bookingId: "b-cb",
      paymentStatus: "paid",
      refundStatus: "refunded",
    });
    expect(result).toEqual({ bookingConfirmed: false, bookingCancelled: false });
    expect(update).not.toHaveBeenCalled();
  });

  it("does not transition booking when payment status is failed", async () => {
    const { tx, update } = makeTx({
      id: "b-2",
      status: "pending",
      detailJson: { guestId: "u-2" },
    });

    const result = await transitionBookingOnPaymentUpdate(tx as unknown as BookingTransitionTx, {
      bookingId: "b-2",
      paymentStatus: "failed",
      refundStatus: null,
    });

    expect(result).toEqual({ bookingConfirmed: false, bookingCancelled: false });
    expect(update).not.toHaveBeenCalled();
  });

  it("confirms pending booking when payment status alias is completed", async () => {
    const { tx, update } = makeTx({
      id: "b-2a",
      status: "pending",
      detailJson: { guestId: "u-2a" },
    });

    const result = await transitionBookingOnPaymentUpdate(tx as unknown as BookingTransitionTx, {
      bookingId: "b-2a",
      paymentStatus: "completed",
      refundStatus: null,
    });

    expect(result).toEqual({ bookingConfirmed: true, bookingCancelled: false });
    expect(update).toHaveBeenCalledTimes(1);
    const payload = update.mock.calls[0]?.[0];
    expect(payload.where.id).toBe("b-2a");
    expect(payload.data.status).toBe("confirmed");
    expect(detailOf(payload).paymentStatus).toBe("paid");
  });

  it("marks pending booking as cancelled_before when refund status is refunded", async () => {
    const { tx, update } = makeTx({
      id: "b-3",
      status: "pending",
      detailJson: { guestId: "u-3", paymentStatus: "paid" },
    });

    const result = await transitionBookingOnPaymentUpdate(tx as unknown as BookingTransitionTx, {
      bookingId: "b-3",
      paymentStatus: "paid",
      refundStatus: "refunded",
    });

    expect(result).toEqual({ bookingConfirmed: false, bookingCancelled: true });
    expect(update).toHaveBeenCalledTimes(1);
    const payload = update.mock.calls[0]?.[0];
    expect(payload.where.id).toBe("b-3");
    expect(payload.data.status).toBe("cancelled_before");
    expect(detailOf(payload).status).toBe("cancelled_before");
    expect(detailOf(payload).paymentStatus).toBe("refunded");
    expect(detailOf(payload).cancelReason).toBe("payment_refunded");
  });

  it("preserves existing cancelledAt and cancelReason on refunded transition", async () => {
    const { tx, update } = makeTx({
      id: "b-3a",
      status: "pending",
      detailJson: {
        guestId: "u-3a",
        cancelledAt: "2026-01-01T00:00:00.000Z",
        cancelReason: "guest_request",
      },
    });

    const result = await transitionBookingOnPaymentUpdate(tx as unknown as BookingTransitionTx, {
      bookingId: "b-3a",
      paymentStatus: "paid",
      refundStatus: "refund_succeeded",
    });

    expect(result).toEqual({ bookingConfirmed: false, bookingCancelled: true });
    expect(update).toHaveBeenCalledTimes(1);
    const payload = update.mock.calls[0]?.[0];
    expect(payload.data.status).toBe("cancelled_before");
    expect(detailOf(payload).cancelledAt).toBe("2026-01-01T00:00:00.000Z");
    expect(detailOf(payload).cancelReason).toBe("guest_request");
  });

  it("marks confirmed booking as cancelled_after when refund status is refunded", async () => {
    const { tx, update } = makeTx({
      id: "b-4",
      status: "confirmed",
      detailJson: { guestId: "u-4", paymentStatus: "paid" },
    });

    const result = await transitionBookingOnPaymentUpdate(tx as unknown as BookingTransitionTx, {
      bookingId: "b-4",
      paymentStatus: "paid",
      refundStatus: "refunded",
    });

    expect(result).toEqual({ bookingConfirmed: false, bookingCancelled: true });
    expect(update).toHaveBeenCalledTimes(1);
    const payload = update.mock.calls[0]?.[0];
    expect(payload.where.id).toBe("b-4");
    expect(payload.data.status).toBe("cancelled_after");
    expect(detailOf(payload).status).toBe("cancelled_after");
    expect(detailOf(payload).paymentStatus).toBe("refunded");
    expect(detailOf(payload).cancelReason).toBe("payment_refunded");
  });

  it("does not transition completed booking on refund update", async () => {
    const { tx, update } = makeTx({
      id: "b-5",
      status: "completed",
      detailJson: { guestId: "u-5", paymentStatus: "paid" },
    });

    const result = await transitionBookingOnPaymentUpdate(tx as unknown as BookingTransitionTx, {
      bookingId: "b-5",
      paymentStatus: "paid",
      refundStatus: "refunded",
    });

    expect(result).toEqual({ bookingConfirmed: false, bookingCancelled: false });
    expect(update).not.toHaveBeenCalled();
  });

  it("does not reconfirm already confirmed booking on paid update", async () => {
    const { tx, update } = makeTx({
      id: "b-6",
      status: "confirmed",
      detailJson: { guestId: "u-6", paymentStatus: "paid" },
    });

    const result = await transitionBookingOnPaymentUpdate(tx as unknown as BookingTransitionTx, {
      bookingId: "b-6",
      paymentStatus: "paid",
      refundStatus: null,
    });

    expect(result).toEqual({ bookingConfirmed: false, bookingCancelled: false });
    expect(update).not.toHaveBeenCalled();
  });

  it("returns no-op when booking record is missing", async () => {
    const { tx, findUnique, update } = makeTx(null);

    const result = await transitionBookingOnPaymentUpdate(tx as unknown as BookingTransitionTx, {
      bookingId: "missing",
      paymentStatus: "paid",
      refundStatus: null,
    });

    expect(findUnique).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ bookingConfirmed: false, bookingCancelled: false });
    expect(update).not.toHaveBeenCalled();
  });

  it("환불 분기 우선: 결제 상태가 아직 pending이어도 refund면 확정하지 않고 취소 전이", async () => {
    const { tx, update } = makeTx({
      id: "b-ref-prio",
      status: "pending",
      detailJson: {},
    });
    const result = await transitionBookingOnPaymentUpdate(tx as unknown as BookingTransitionTx, {
      bookingId: "b-ref-prio",
      paymentStatus: "pending",
      refundStatus: "refunded",
    });
    expect(result).toEqual({ bookingConfirmed: false, bookingCancelled: true });
    expect(update).toHaveBeenCalledTimes(1);
    expect(update.mock.calls[0]?.[0].data.status).toBe("cancelled_before");
  });

  it("환불만 있는 PATCH: paymentStatus null + refund_status 로도 취소", async () => {
    const { tx, update } = makeTx({
      id: "b-ref-null-pay",
      status: "pending",
      detailJson: { guestId: "g" },
    });
    const result = await transitionBookingOnPaymentUpdate(tx as unknown as BookingTransitionTx, {
      bookingId: "b-ref-null-pay",
      paymentStatus: null,
      refundStatus: "refunded",
    });
    expect(result).toEqual({ bookingConfirmed: false, bookingCancelled: true });
    expect(update).toHaveBeenCalledTimes(1);
  });

  it("환불 상태 별칭 대소문자 무시: REFUND_SUCCEEDED", async () => {
    const { tx, update } = makeTx({
      id: "b-ref-case",
      status: "confirmed",
      detailJson: {},
    });
    const result = await transitionBookingOnPaymentUpdate(tx as unknown as BookingTransitionTx, {
      bookingId: "b-ref-case",
      paymentStatus: "paid",
      refundStatus: "REFUND_SUCCEEDED",
    });
    expect(result).toEqual({ bookingConfirmed: false, bookingCancelled: true });
    expect(update.mock.calls[0]?.[0].data.status).toBe("cancelled_after");
  });

  it("이미 cancelled_after 인 예약에 동일 환불 이벤트 재전달 시 멱등 noop", async () => {
    const { tx, update } = makeTx({
      id: "b-ca-idem",
      status: "cancelled_after",
      detailJson: { paymentStatus: "refunded", cancelReason: "payment_refunded" },
    });
    const result = await transitionBookingOnPaymentUpdate(tx as unknown as BookingTransitionTx, {
      bookingId: "b-ca-idem",
      paymentStatus: "paid",
      refundStatus: "refunded",
    });
    expect(result).toEqual({ bookingConfirmed: false, bookingCancelled: false });
    expect(update).not.toHaveBeenCalled();
  });
});

