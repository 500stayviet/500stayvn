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
import { readStoredUiLanguage } from "@/lib/uiLanguageStorage";
import { getUIText } from "@/utils/i18n";
import type { BookingData } from "./bookingsTypes";

function paymentDefaultError(): string {
  return getUIText("bookingPaymentMetaDefaultError", readStoredUiLanguage());
}

function paymentCreateError(): string {
  return getUIText("bookingPaymentMetaCreateError", readStoredUiLanguage());
}

export type PatchPaymentMetaResult =
  | { ok: false }
  | { ok: true; transition: PaymentServerTransition };

function emitPayCompleteTransitionToast(t: PaymentServerTransition) {
  const lang = readStoredUiLanguage();
  if (t.bookingCancelled) {
    emitUserFacingAppToast({
      tone: "info",
      area: "bookings",
      action: "payment",
      message: getUIText("bookingPaymentToastRefundCancelledBody", lang),
    });
    return;
  }
  if (t.bookingConfirmed) {
    emitUserFacingAppToast({
      tone: "success",
      area: "bookings",
      action: "payment",
      message: getUIText("bookingPaymentToastConfirmedBody", lang),
    });
    return;
  }
  emitUserFacingAppToast({
    tone: "info",
    area: "bookings",
    action: "payment",
    message: getUIText("bookingPaymentToastSyncedBody", lang),
  });
}

export function emitRefundAdminTransitionToast(t: PaymentServerTransition) {
  const lang = readStoredUiLanguage();
  if (t.bookingCancelled) {
    emitUserFacingAppToast({
      tone: "success",
      area: "bookings",
      action: "refund",
      message: getUIText("bookingRefundToastCancelledBody", lang),
    });
    return;
  }
  emitUserFacingAppToast({
    tone: "info",
    area: "bookings",
    action: "refund",
    message: getUIText("bookingRefundToastSyncedBody", lang),
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
        message: parsed.errorMessage || paymentCreateError(),
      });
      return false;
    }
    return true;
  } catch (e) {
    console.warn("[payments] create meta failed", e);
    emitUserFacingSyncError({
      area: "bookings",
      action: "payment_create",
      message: paymentDefaultError(),
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
        message: parsed.errorMessage || paymentDefaultError(),
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
      message: paymentDefaultError(),
    });
    return { ok: false };
  }
}
