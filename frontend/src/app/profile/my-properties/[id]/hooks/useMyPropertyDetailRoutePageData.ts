"use client";

import { useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { useMyPropertyDetailPageState } from "./useMyPropertyDetailPageState";

/**
 * 내 매물 상세(직접 URL) — 라우터·인증·언어·매물 로드 데이터 레이어.
 * 매물 한 건은 `getProperty` → `parseAppPropertyDetailPayload`(`unwrapAppApiData`) 경로.
 */
export function useMyPropertyDetailRoutePageData() {
  const router = useRouter();
  const params = useParams();
  const propertyId = params.id as string;
  const { user, loading: authLoading } = useAuth();
  const { currentLanguage, setCurrentLanguage } = useLanguage();

  const onRedirectToList = useCallback(() => {
    router.push("/profile/my-properties");
  }, [router]);

  const { property, loading } = useMyPropertyDetailPageState({
    propertyId,
    user: user ? { uid: user.uid } : null,
    authLoading,
    onRedirectToList,
  });

  return {
    router,
    propertyId,
    user,
    authLoading,
    currentLanguage,
    setCurrentLanguage,
    property,
    loading,
  };
}

export type MyPropertyDetailRoutePageData = ReturnType<
  typeof useMyPropertyDetailRoutePageData
>;
