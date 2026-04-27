"use client";

import { useCallback } from "react";
import {
  emitUserFacingAppToast,
  emitUserFacingSyncError,
} from "@/lib/runtime/networkResilience";
import type { BookingSuccessPageData } from "./useBookingSuccessPageData";
import { getUIText } from "@/utils/i18n";

/**
 * 예약 완료 화면 사용자 액션 (클립보드·토스트).
 */
export function useBookingSuccessPageActions(data: BookingSuccessPageData) {
  const { currentLanguage, setCopied } = data;

  const copyToClipboard = useCallback(
    (text: string) => {
      void navigator.clipboard
        .writeText(text)
        .then(() => {
          setCopied(true);
          window.setTimeout(() => setCopied(false), 2000);
          emitUserFacingAppToast({
            tone: "success",
            area: "bookings",
            action: "copy_booking_id",
            message: getUIText("bookingSuccessCopyOk", currentLanguage),
          });
        })
        .catch(() => {
          emitUserFacingSyncError({
            area: "bookings",
            action: "copy_booking_id",
            message: getUIText("bookingSuccessCopyFail", currentLanguage),
          });
        });
    },
    [currentLanguage, setCopied],
  );

  return {
    copyToClipboard,
  };
}
