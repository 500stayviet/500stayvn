'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { AdminPermissionMap } from '@/lib/adminPermissions';

export type AdminMe = {
  id: string;
  username: string;
  nickname: string;
  isSuperAdmin: boolean;
  permissions: AdminPermissionMap;
};

type Ctx = {
  me: AdminMe | null;
  loading: boolean;
  refresh: () => Promise<void>;
};

const AdminMeContext = createContext<Ctx | null>(null);

export function AdminMeProvider({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<AdminMe | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const r = await fetch('/api/admin/me', { credentials: 'include' });
    if (!r.ok) {
      setMe(null);
      return;
    }
    const j = (await r.json()) as AdminMe;
    setMe(j);
  }, []);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    refresh().finally(() => {
      if (alive) setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [refresh]);

  const value = useMemo(() => ({ me, loading, refresh }), [me, loading, refresh]);

  return <AdminMeContext.Provider value={value}>{children}</AdminMeContext.Provider>;
}

export function useAdminMe(): Ctx {
  const v = useContext(AdminMeContext);
  if (!v) {
    throw new Error('useAdminMe must be used within AdminMeProvider');
  }
  return v;
}
