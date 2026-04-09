'use client';

import { useEffect } from 'react';
import { bootstrapUsersFromServer } from '@/lib/api/auth';
import { bootstrapPropertiesFromServer } from '@/lib/api/properties';
import { bootstrapBookingsFromServer } from '@/lib/api/bookings';

let appBootstrapPromise: Promise<void> | null = null;

function runAppBootstrapOnce(): Promise<void> {
  if (appBootstrapPromise) return appBootstrapPromise;
  appBootstrapPromise = (async () => {
    try {
      await bootstrapUsersFromServer();
    } catch (error) {
      console.warn('[AppUserSync] users bootstrap failed', error);
    }
    try {
      await bootstrapPropertiesFromServer();
    } catch (error) {
      console.warn('[AppUserSync] properties bootstrap failed', error);
    }
    try {
      await bootstrapBookingsFromServer();
    } catch (error) {
      console.warn('[AppUserSync] bookings bootstrap failed', error);
    }
  })();
  return appBootstrapPromise;
}

/**
 * 앱 로드 시 회원 → 매물 → 예약 순으로 PostgreSQL 원장과 클라이언트 캐시를 동기화합니다.
 */
export default function AppUserSync() {
  useEffect(() => {
    void runAppBootstrapOnce();
  }, []);
  return null;
}
