/**
 * 예약 — 결제 메타(POST/ PATCH) + 전이 토스트 (Mutation 보조, 외부 직접 import 금지)
 */

import {
  emitUserFacingAppToast,
  emitUserFacingSyncError,
} from "@/lib/runtime/networkResilience";
import { withAppActor } from "@/lib/api/withAppActor";
import {
  parseAppPaymentResponse,
  parsePaymentPatchData,
  type PaymentServerTransition,
} from "@/lib/api/appPaymentResponse";
import type { BookingData } from "./bookingsTypes";

const PAYMENT_DEFAULT_ERROR =
  "결제 정보를 서버에 반영하지 못했습니다. 잠시 후 다시 시도해 주세요.";

const PAYMENT_CREATE_ERROR =
  "결제(메타)를 등록하지 못했습니다. 예약은 생성되었으나 결제 직전에 새로고침하거나 고객센터에 문의해 주세요.";

export type PatchPaymentMetaResult =
  | { ok: false }
  | { ok: true; transition: PaymentServerTransition };

function emitPayCompleteTransitionToast(t: PaymentServerTransition) {
  if (t.bookingCancelled) {
    emitUserFacingAppToast({
      tone: "info",
      area: "bookings",
      action: "payment",
      message:
        "결제(환불) 반영에 따라 예약이 취소 처리되었습니다. 내 예약에서 상태를 확인해 주세요.",
    });
    return;
  }
  if (t.bookingConfirmed) {
    emitUserFacingAppToast({
      tone: "success",
      area: "bookings",
      action: "payment",
      message: "결제가 완료되어 예약이 확정되었습니다.",
    });
    return;
  }
  emitUserFacingAppToast({
    tone: "info",
    area: "bookings",
    action: "payment",
    message:
      "결제 정보가 서버에 반영되었습니다. 최신 예약 상태는 내 예약에서 확인해 주세요.",
  });
}

export function emitRefundAdminTransitionToast(t: PaymentServerTransition) {
  if (t.bookingCancelled) {
    emitUserFacingAppToast({
      tone: "success",
      area: "bookings",
      action: "refund",
      message: "환불이 반영되어 예약이 취소(환불) 처리되었습니다.",
    });
    return;
  }
  emitUserFacingAppToast({
    tone: "info",
    area: "bookings",
    action: "refund",
    message: "환불 결제 정보가 서버에 반영되었습니다.",
  });
}

export { emitPayCompleteTransitionToast };

export async function createPaymentMetaForBooking(
  booking: BookingData,
): Promise<boolean> {
  if (typeof window === "undefined") return false;
  try {
    const res = await fetch(
      "/api/app/payments",
      withAppActor({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: booking.id,
          userId: booking.guestId,
          amount: booking.totalPrice,
          currency: booking.priceUnit,
          status: booking.paymentStatus || "pending",
          metaJson: {
            propertyId: booking.propertyId,
            ownerId: booking.ownerId,
            nights: booking.nights,
          },
        }),
      }),
    );
    const parsed = await parseAppPaymentResponse(res);
    if (!parsed.ok) {
      console.warn("[payments] create meta failed", parsed);
      emitUserFacingSyncError({
        area: "bookings",
        action: "payment_create",
        message: parsed.errorMessage || PAYMENT_CREATE_ERROR,
      });
      return false;
    }
    return true;
  } catch (e) {
    console.warn("[payments] create meta failed", e);
    emitUserFacingSyncError({
      area: "bookings",
      action: "payment_create",
      message: PAYMENT_DEFAULT_ERROR,
    });
    return false;
  }
}

export async function patchPaymentMetaByBooking(
  bookingId: string,
  patch: Record<string, unknown>,
): Promise<PatchPaymentMetaResult> {
  if (typeof window === "undefined") return { ok: false };
  try {
    const res = await fetch(
      `/api/app/payments/${encodeURIComponent(bookingId)}`,
      withAppActor({
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      }),
    );
    const parsed = await parseAppPaymentResponse(res);
    if (!parsed.ok) {
      console.warn("[payments] patch meta failed", parsed);
      emitUserFacingSyncError({
        area: "bookings",
        action: "payment_patch",
        message: parsed.errorMessage || PAYMENT_DEFAULT_ERROR,
      });
      return { ok: false };
    }
    const { transition } = parsePaymentPatchData(parsed.data);
    return { ok: true, transition };
  } catch (e) {
    console.warn("[payments] patch meta failed", e);
    emitUserFacingSyncError({
      area: "bookings",
      action: "payment_patch",
      message: PAYMENT_DEFAULT_ERROR,
    });
    return { ok: false };
  }
}
