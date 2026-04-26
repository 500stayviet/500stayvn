"use client";

import { useMyPropertyDetailRoutePageData } from "./useMyPropertyDetailRoutePageData";
import { useMyPropertyDetailRoutePageActions } from "./useMyPropertyDetailRoutePageActions";

/** 내 매물 상세(직접 URL): Data + Actions 조합. */
export function useMyPropertyDetailRoutePage() {
  const pageData = useMyPropertyDetailRoutePageData();
  const actions = useMyPropertyDetailRoutePageActions(pageData);
  return { ...pageData, ...actions };
}

export type MyPropertyDetailRoutePageViewModel = ReturnType<
  typeof useMyPropertyDetailRoutePage
>;
