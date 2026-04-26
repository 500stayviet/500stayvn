"use client";

import { useMyBookingsPageData } from "./useMyBookingsPageData";
import { useMyBookingsPageActions } from "./useMyBookingsPageActions";

/**
 * 게스트 내 예약: Data + Actions 조합.
 */
export function useMyBookingsPage() {
  const pageData = useMyBookingsPageData();
  const actions = useMyBookingsPageActions(pageData);
  return { ...pageData, ...actions };
}

export type MyBookingsPageViewModel = ReturnType<typeof useMyBookingsPage>;
