"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { getProperty } from "@/lib/api/properties";
import type { PropertyData } from "@/types/property";

/**
 * 인터셉트 모달 매물 상세 — 소유자 검증 후 매물 로드.
 * `getProperty` → `parseAppPropertyDetailPayload`(`unwrapAppApiData`).
 */
export function useInterceptedMyPropertyDetailPageData() {
  const params = useParams();
  const propertyId = params.id as string;
  const { user } = useAuth();
  const { currentLanguage } = useLanguage();
  const [property, setProperty] = useState<PropertyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!propertyId || !user) {
      setLoading(false);
      return;
    }
    const fetchProperty = async () => {
      try {
        const data = await getProperty(propertyId);
        if (data && data.ownerId === user.uid) setProperty(data);
        else setProperty(null);
      } catch {
        setProperty(null);
      } finally {
        setLoading(false);
      }
    };
    void fetchProperty();
  }, [propertyId, user]);

  return { propertyId, user, currentLanguage, property, loading };
}

export type InterceptedMyPropertyDetailPageData = ReturnType<
  typeof useInterceptedMyPropertyDetailPageData
>;
