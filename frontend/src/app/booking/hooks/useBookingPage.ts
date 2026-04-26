"use client";

import { useBookingPageData } from "./useBookingPageData";
import { useBookingPageActions } from "./useBookingPageActions";

/**
 * 예약 페이지: 데이터 훅 + 액션 훅 조합 (라우트·뷰는 이 훅만 사용).
 */
export function useBookingPage() {
  const pageData = useBookingPageData();
  const actions = useBookingPageActions(pageData);
  return { ...pageData, ...actions };
}

export type BookingPageViewModel = ReturnType<typeof useBookingPage>;
