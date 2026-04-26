"use client";

import { useHostBookingsPageData } from "./useHostBookingsPageData";
import { useHostBookingsPageActions } from "./useHostBookingsPageActions";

/**
 * 임대인 예약 관리: Data + Actions 조합.
 */
export function useHostBookingsPage() {
  const pageData = useHostBookingsPageData();
  const actions = useHostBookingsPageActions(pageData);
  return { ...pageData, ...actions };
}

export type HostBookingsPageViewModel = ReturnType<typeof useHostBookingsPage>;
