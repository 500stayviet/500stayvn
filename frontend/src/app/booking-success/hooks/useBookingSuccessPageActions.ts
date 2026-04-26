"use client";

import { useCallback } from "react";
import {
  emitUserFacingAppToast,
  emitUserFacingSyncError,
} from "@/lib/runtime/networkResilience";
import type { BookingSuccessPageData } from "./useBookingSuccessPageData";

function copyOkMessage(lang: string): string {
  if (lang === "ko") return "예약 번호가 클립보드에 복사되었습니다.";
  if (lang === "vi") return "Đã sao chép mã đặt phòng.";
  return "Booking number copied to clipboard.";
}

function copyFailMessage(lang: string): string {
  if (lang === "ko") return "복사에 실패했습니다. 번호를 직접 선택해 복사해 주세요.";
  if (lang === "vi") return "Sao chép thất bại. Vui lòng chọn và sao chép thủ công.";
  return "Copy failed. Please select the number and copy manually.";
}

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
            message: copyOkMessage(currentLanguage),
          });
        })
        .catch(() => {
          emitUserFacingSyncError({
            area: "bookings",
            action: "copy_booking_id",
            message: copyFailMessage(currentLanguage),
          });
        });
    },
    [currentLanguage, setCopied],
  );

  return {
    copyToClipboard,
  };
}
