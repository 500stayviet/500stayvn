"use client";

import { useCallback } from "react";
import type { MyPropertyDetailRoutePageData } from "./useMyPropertyDetailRoutePageData";

/**
 * 내 매물 상세(직접 URL) — 뒤로/편집 네비게이션 액션.
 */
export function useMyPropertyDetailRoutePageActions(
  data: MyPropertyDetailRoutePageData,
) {
  const { router, propertyId } = data;

  const onBackToList = useCallback(() => {
    router.push("/profile/my-properties");
  }, [router]);

  const onEdit = useCallback(() => {
    router.push(`/profile/my-properties/${propertyId}/edit`);
  }, [router, propertyId]);

  return { onBackToList, onEdit };
}
