'use client';

import { usePathname } from 'next/navigation';
import BottomNavigation from '@/components/BottomNavigation';
import AppBox from '@/components/AppBox';

/**
 * 소비자 앱: 430px 박스 + 하단 네비.
 * /admin/* : 전폭 레이아웃, 하단바 없음 (관리자 PC용).
 */
export default function ConditionalRootShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin') ?? false;

  if (isAdmin) {
    return <div className="min-h-screen bg-slate-100 text-slate-900 antialiased">{children}</div>;
  }

  return (
    <div className="flex min-h-screen justify-center bg-[#F3F4F6]">
      <AppBox className="flex min-h-screen w-full max-w-[430px] flex-col bg-white shadow-2xl">
        <main className="flex-1 pb-14">{children}</main>
        <BottomNavigation />
      </AppBox>
    </div>
  );
}
