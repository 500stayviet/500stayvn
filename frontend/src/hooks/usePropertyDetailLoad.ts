'use client';

import { useState, useEffect } from 'react';
import { getProperty } from '@/lib/api/properties';
import type { PropertyData } from '@/types/property';

/** 매물 ID로 `getProperty` 한 건 로드 (직접 페이지·인터셉트 라우트 공통). */
export function usePropertyDetailLoad(propertyId: string | undefined) {
  const [property, setProperty] = useState<PropertyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!propertyId) {
      setLoading(false);
      return;
    }
    void (async () => {
      try {
        const data = await getProperty(propertyId);
        setProperty(data);
      } catch {
        setProperty(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [propertyId]);

  return { property, loading };
}
