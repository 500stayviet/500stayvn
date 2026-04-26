"use client";

import { useBookingSuccessPageData } from "./useBookingSuccessPageData";
import { useBookingSuccessPageActions } from "./useBookingSuccessPageActions";

/**
 * 예약 완료 화면: `useBookingSuccessPageData` + `useBookingSuccessPageActions` 조합.
 */
export function useBookingSuccessPage() {
  const pageData = useBookingSuccessPageData();
  const actions = useBookingSuccessPageActions(pageData);
  return { ...pageData, ...actions };
}

export type BookingSuccessPageViewModel = ReturnType<typeof useBookingSuccessPage>;
