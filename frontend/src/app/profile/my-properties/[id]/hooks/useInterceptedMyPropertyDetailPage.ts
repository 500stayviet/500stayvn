"use client";

import { useInterceptedMyPropertyDetailPageData } from "./useInterceptedMyPropertyDetailPageData";
import { useInterceptedMyPropertyDetailPageActions } from "./useInterceptedMyPropertyDetailPageActions";

/** 내 매물 카드 → 모달(인터셉트): Data + Actions 조합. */
export function useInterceptedMyPropertyDetailPage() {
  const pageData = useInterceptedMyPropertyDetailPageData();
  const actions = useInterceptedMyPropertyDetailPageActions(pageData);
  return { ...pageData, ...actions };
}

export type InterceptedMyPropertyDetailPageViewModel = ReturnType<
  typeof useInterceptedMyPropertyDetailPage
>;
