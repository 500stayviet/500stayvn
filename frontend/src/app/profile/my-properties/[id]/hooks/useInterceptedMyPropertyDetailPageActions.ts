"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import type { InterceptedMyPropertyDetailPageData } from "./useInterceptedMyPropertyDetailPageData";

/**
 * 인터셉트 모달 — 뒤로 가기·편집 이동(tab=deleted·from=modal 쿼리 유지).
 */
export function useInterceptedMyPropertyDetailPageActions(
  data: InterceptedMyPropertyDetailPageData,
) {
  const router = useRouter();
  const { property } = data;

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleEdit = useCallback(() => {
    if (!property) return;
    const q =
      typeof window !== "undefined" && window.location.search.includes("tab=deleted")
        ? "tab=deleted&from=modal"
        : "from=modal";
    router.push(`/profile/my-properties/${property.id}/edit?${q}`);
  }, [router, property]);

  return { handleBack, handleEdit };
}
