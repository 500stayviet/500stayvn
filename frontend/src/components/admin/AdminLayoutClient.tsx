'use client';

import { usePathname } from 'next/navigation';
import AdminChrome from '@/components/admin/AdminChrome';
import AdminDomainEventBridge from '@/components/admin/AdminDomainEventBridge';
import { AdminMeProvider } from '@/contexts/AdminMeContext';

export default function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === '/admin/login';

  if (isLogin) {
    return <div className="min-h-screen">{children}</div>;
  }

  return (
    <AdminMeProvider>
      <AdminDomainEventBridge />
      <AdminChrome>{children}</AdminChrome>
    </AdminMeProvider>
  );
}
