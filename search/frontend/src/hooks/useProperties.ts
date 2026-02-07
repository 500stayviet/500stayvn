/**
 * useProperties Hook
 * 
 * Firestore에서 매물 데이터를 실시간으로 가져오는 커스텀 Hook
 * 
 * React Hooks 패턴:
 * - use로 시작하는 함수는 커스텀 Hook
 * - 다른 Hook (useState, useEffect)을 사용할 수 있음
 * - 컴포넌트에서 재사용 가능한 로직을 추출
 */

import { useState, useEffect } from 'react';
import { subscribeToProperties, getAvailableProperties } from '@/lib/api/properties';
import { PropertyData } from '@/types/property';

/**
 * 매물 데이터와 로딩 상태를 관리하는 Hook
 * 
 * @returns { properties, loading, error }
 */
export function useProperties() {
  // 상태 관리
  const [properties, setProperties] = useState<PropertyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // 클라이언트 사이드에서만 실행
    setMounted(true);
    
    // 브라우저 환경 확인
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      setLoading(false);
      return;
    }

    // 실시간 리스너 등록
    const unsubscribe = subscribeToProperties((data) => {
      console.log('[useProperties] Properties updated:', data.length);
      setProperties(data);
      setLoading(false);
      setError(null);
    });

    // 컴포넌트 언마운트 시 리스너 해제
    return () => {
      unsubscribe();
    };
  }, []);

  // 서버 사이드에서는 빈 배열과 로딩 false 반환
  if (!mounted) {
    return { properties: [], loading: true, error: null };
  }

  return { properties, loading, error };
}
