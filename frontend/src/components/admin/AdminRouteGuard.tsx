'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  adminHasPermission,
  firstNavHrefForAdmin,
  requiredPermissionForPathname,
} from '@/lib/adminPermissions';
import { useAdminMe } from '@/contexts/AdminMeContext';

export default function AdminRouteGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() || '';
  const { me, loading } = useAdminMe();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!me) {
      router.replace('/admin/login');
      setAllowed(false);
      return;
    }
    const req = requiredPermissionForPathname(pathname);
    if (req === null) {
      setAllowed(true);
      return;
    }
    if (req === 'super') {
      if (!me.isSuperAdmin) {
        router.replace('/admin');
        setAllowed(false);
        return;
      }
      setAllowed(true);
      return;
    }
    if (!adminHasPermission(me.isSuperAdmin, me.permissions, req)) {
      router.replace(firstNavHrefForAdmin(me.isSuperAdmin, me.permissions));
      setAllowed(false);
      return;
    }
    setAllowed(true);
  }, [loading, me, pathname, router]);

  if (loading || !allowed) return null;
  return <>{children}</>;
}

