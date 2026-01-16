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
import { PropertyData, subscribeToProperties, getAllProperties } from '@/lib/api/properties';

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

    // 초기 데이터 로드
    const loadInitialData = async () => {
      try {
        setLoading(true);
        console.log('[useProperties] Loading initial data...');
        const data = await getAllProperties();
        console.log('[useProperties] Loaded', data.length, 'properties');
        setProperties(data);
        setError(null);
      } catch (err) {
        console.error('[useProperties] Error loading data:', err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
        setProperties([]);
      } finally {
        setLoading(false);
      }
    };

    // 약간의 지연을 두고 데이터 로드 (모바일에서 localStorage 접근 안정화)
    const timer = setTimeout(() => {
      loadInitialData();
    }, 0);

    // 실시간 리스너 등록
    const unsubscribe = subscribeToProperties((data) => {
      console.log('[useProperties] Properties updated:', data.length);
      setProperties(data);
      setLoading(false);
      setError(null);
    });

    // 컴포넌트 언마운트 시 리스너 해제
    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, []);

  // 서버 사이드에서는 빈 배열과 로딩 false 반환
  if (!mounted) {
    return { properties: [], loading: true, error: null };
  }

  return { properties, loading, error };
}
