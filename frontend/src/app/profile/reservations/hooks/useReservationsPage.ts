"use client";

import { useReservationsPageData } from "./useReservationsPageData";
import { useReservationsPageActions } from "./useReservationsPageActions";

/** 임대인 예약 관리: Data + Actions 조합. */
export function useReservationsPage() {
  const pageData = useReservationsPageData();
  const actions = useReservationsPageActions(pageData);
  return { ...pageData, ...actions };
}

export type ReservationsPageViewModel = ReturnType<typeof useReservationsPage>;
