'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import AdminChrome from '@/components/admin/AdminChrome';
import AdminDomainEventBridge from '@/components/admin/AdminDomainEventBridge';
import { AdminMeProvider } from '@/contexts/AdminMeContext';

export default function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === '/admin/login';
  const [enableRealtime, setEnableRealtime] = useState(false);

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
