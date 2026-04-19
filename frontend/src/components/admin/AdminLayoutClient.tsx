'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import AdminChrome from '@/components/admin/AdminChrome';
import AdminDomainEventBridge from '@/components/admin/AdminDomainEventBridge';
import { AdminMeProvider } from '@/contexts/AdminMeContext';
import { ensureUsersCacheForAdmin } from '@/lib/api/auth';
import { ensureBookingsCacheForAdmin } from '@/lib/api/bookings';
import { ensurePropertiesCacheForAdmin } from '@/lib/api/properties';
import { ADMIN_SYSTEM_LOG_STORAGE_KEY } from '@/lib/adminSystemLog';

const ADMIN_LEGACY_LOCAL_STORAGE_KEYS = [
  'admin_user_detail_memos_v1',
  'admin_moderation_audit_v1',
  ADMIN_SYSTEM_LOG_STORAGE_KEY,
  'deleted_properties_log',
  'cancelled_properties_log',
] as const;

export default function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === '/admin/login';
  const [enableRealtime, setEnableRealtime] = useState(false);

  useEffect(() => {
    if (isLogin) return;
    void Promise.all([
      ensureUsersCacheForAdmin(),
      ensurePropertiesCacheForAdmin(),
      ensureBookingsCacheForAdmin(),
    ]).catch(() => {
      /* 각 모듈이 이미 토스트/로그 처리 */
    });
  }, [isLogin]);

  useEffect(() => {
    if (isLogin || typeof window === 'undefined') return;
    try {
      for (const key of ADMIN_LEGACY_LOCAL_STORAGE_KEYS) {
        try {
          localStorage.removeItem(key);
        } catch {
          /* ignore */
        }
      }
    } catch {
      /* ignore */
    }
  }, [isLogin]);

  useEffect(() => {
    if (isLogin) return;
    // Delay SSE subscription so first admin screen can render sooner.
    const timer = setTimeout(() => setEnableRealtime(true), 1500);
    return () => clearTimeout(timer);
  }, [isLogin]);

  if (isLogin) {
    return <div className="min-h-screen">{children}</div>;
  }

  return (
    <AdminMeProvider>
      {enableRealtime ? <AdminDomainEventBridge /> : null}
      <AdminChrome>{children}</AdminChrome>
    </AdminMeProvider>
  );
}
