'use client';

import { useParams } from 'next/navigation';
import { usePropertyDetailLoad } from '@/hooks/usePropertyDetailLoad';

/** `/properties/[id]` 직접 진입 시 매물 한 건만 서버 캐시 경로로 로드한다. */
export function usePropertyDetailPage() {
  const params = useParams();
  const propertyId = params.id as string;
  const { property, loading } = usePropertyDetailLoad(propertyId);

  return { propertyId, property, loading };
}

export type PropertyDetailPageViewModel = ReturnType<typeof usePropertyDetailPage>;
