"use client";

import { useSettlementPageData } from "./useSettlementPageData";
import { useSettlementPageActions } from "./useSettlementPageActions";

/** 정산·지갑: Data + Actions 조합. */
export function useSettlementPage() {
  const pageData = useSettlementPageData();
  const actions = useSettlementPageActions(pageData);
  return { ...pageData, ...actions };
}

export type SettlementPageViewModel = ReturnType<typeof useSettlementPage>;
