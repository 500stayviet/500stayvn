import { describe, expect, it, vi } from "vitest";
import { transitionBookingOnPaymentUpdate } from "./bookingPaymentTransition";

type MockBookingRecord = {
  id: string;
  status: string;
  detailJson: Record<string, unknown> | null;
};

function makeTx(record: MockBookingRecord | null) {
  const update = vi.fn(async ({ data }: any) => ({
    id: record?.id ?? "missing",
    status: data?.status ?? record?.status,
    detailJson: data?.detailJson ?? record?.detailJson,
  }));
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

describe("transitionBookingOnPaymentUpdate", () => {
  it("confirms pending booking when payment is paid", async () => {
    const { tx, update } = makeTx({
      id: "b-1",
      status: "pending",
      detailJson: { guestId: "u-1" },
    });

    const result = await transitionBookingOnPaymentUpdate(tx as any, {
      bookingId: "b-1",
      paymentStatus: "paid",
      refundStatus: null,
    });

    expect(result).toEqual({ bookingConfirmed: true, bookingCancelled: false });
    expect(update).toHaveBeenCalledTimes(1);
    const payload = update.mock.calls[0]?.[0];
    expect(payload.where.id).toBe("b-1");
    expect(payload.data.status).toBe("confirmed");
    expect(payload.data.detailJson.status).toBe("confirmed");
    expect(payload.data.detailJson.paymentStatus).toBe("paid");
    expect(typeof payload.data.detailJson.confirmedAt).toBe("string");
  });

  it("does not transition booking when payment status is failed", async () => {
    const { tx, update } = makeTx({
      id: "b-2",
      status: "pending",
      detailJson: { guestId: "u-2" },
    });

    const result = await transitionBookingOnPaymentUpdate(tx as any, {
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

    const result = await transitionBookingOnPaymentUpdate(tx as any, {
      bookingId: "b-2a",
      paymentStatus: "completed",
      refundStatus: null,
    });

    expect(result).toEqual({ bookingConfirmed: true, bookingCancelled: false });
    expect(update).toHaveBeenCalledTimes(1);
    const payload = update.mock.calls[0]?.[0];
    expect(payload.where.id).toBe("b-2a");
    expect(payload.data.status).toBe("confirmed");
    expect(payload.data.detailJson.paymentStatus).toBe("paid");
  });

  it("marks pending booking as cancelled_before when refund status is refunded", async () => {
    const { tx, update } = makeTx({
      id: "b-3",
      status: "pending",
      detailJson: { guestId: "u-3", paymentStatus: "paid" },
    });

    const result = await transitionBookingOnPaymentUpdate(tx as any, {
      bookingId: "b-3",
      paymentStatus: "paid",
      refundStatus: "refunded",
    });

    expect(result).toEqual({ bookingConfirmed: false, bookingCancelled: true });
    expect(update).toHaveBeenCalledTimes(1);
    const payload = update.mock.calls[0]?.[0];
    expect(payload.where.id).toBe("b-3");
    expect(payload.data.status).toBe("cancelled_before");
    expect(payload.data.detailJson.status).toBe("cancelled_before");
    expect(payload.data.detailJson.paymentStatus).toBe("refunded");
    expect(payload.data.detailJson.cancelReason).toBe("payment_refunded");
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

    const result = await transitionBookingOnPaymentUpdate(tx as any, {
      bookingId: "b-3a",
      paymentStatus: "paid",
      refundStatus: "refund_succeeded",
    });

    expect(result).toEqual({ bookingConfirmed: false, bookingCancelled: true });
    expect(update).toHaveBeenCalledTimes(1);
    const payload = update.mock.calls[0]?.[0];
    expect(payload.data.status).toBe("cancelled_before");
    expect(payload.data.detailJson.cancelledAt).toBe("2026-01-01T00:00:00.000Z");
    expect(payload.data.detailJson.cancelReason).toBe("guest_request");
  });

  it("marks confirmed booking as cancelled_after when refund status is refunded", async () => {
    const { tx, update } = makeTx({
      id: "b-4",
      status: "confirmed",
      detailJson: { guestId: "u-4", paymentStatus: "paid" },
    });

    const result = await transitionBookingOnPaymentUpdate(tx as any, {
      bookingId: "b-4",
      paymentStatus: "paid",
      refundStatus: "refunded",
    });

    expect(result).toEqual({ bookingConfirmed: false, bookingCancelled: true });
    expect(update).toHaveBeenCalledTimes(1);
    const payload = update.mock.calls[0]?.[0];
    expect(payload.where.id).toBe("b-4");
    expect(payload.data.status).toBe("cancelled_after");
    expect(payload.data.detailJson.status).toBe("cancelled_after");
    expect(payload.data.detailJson.paymentStatus).toBe("refunded");
    expect(payload.data.detailJson.cancelReason).toBe("payment_refunded");
  });

  it("does not transition completed booking on refund update", async () => {
    const { tx, update } = makeTx({
      id: "b-5",
      status: "completed",
      detailJson: { guestId: "u-5", paymentStatus: "paid" },
    });

    const result = await transitionBookingOnPaymentUpdate(tx as any, {
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

    const result = await transitionBookingOnPaymentUpdate(tx as any, {
      bookingId: "b-6",
      paymentStatus: "paid",
      refundStatus: null,
    });

    expect(result).toEqual({ bookingConfirmed: false, bookingCancelled: false });
    expect(update).not.toHaveBeenCalled();
  });

  it("returns no-op when booking record is missing", async () => {
    const { tx, findUnique, update } = makeTx(null);

    const result = await transitionBookingOnPaymentUpdate(tx as any, {
      bookingId: "missing",
      paymentStatus: "paid",
      refundStatus: null,
    });

    expect(findUnique).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ bookingConfirmed: false, bookingCancelled: false });
    expect(update).not.toHaveBeenCalled();
  });
});

