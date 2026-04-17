'use client';

import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, UserCog } from 'lucide-react';
import { ADMIN_NAV_ITEMS, type AdminNavItem } from '@/lib/adminNav';
import { adminHasPermission } from '@/lib/adminPermissions';
import { useAdminMe } from '@/contexts/AdminMeContext';
import {
  ADMIN_BADGES_REFRESH_EVENT,
  badgeCountForNav,
  fetchAdminBadgeCounts,
  fetchAdminBadgeCountsFromServer,
  type AdminBadgeCounts,
} from '@/lib/adminBadgeCounts';
import { logoutAdmin } from '@/lib/api/adminAuth';
function navActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  if (href === '/admin') {
    return pathname === '/admin' || pathname === '/admin/dashboard';
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function formatBadge(n: number): string {
  if (n <= 0) return '';
  return n > 99 ? '99+' : String(n);
}

const NavBadge = memo(function NavBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span
      className="ml-1 inline-flex min-h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white tabular-nums"
      aria-label={`알림 ${formatBadge(count)}건`}
    >
      {formatBadge(count)}
    </span>
  );
});

const AdminNavLinks = memo(function AdminNavLinks({
  compact,
  pathname,
  badgeByHref,
  items,
  onItemClick,
}: {
  compact: boolean;
  pathname: string | null;
  badgeByHref: Map<string, number> | null;
  items: AdminNavItem[];
  onItemClick?: (href: string) => void;
}) {
  return (
    <>
      {items.map((item) => {
        const active = navActive(pathname, item.href);
        const n = badgeByHref?.get(item.href) ?? 0;
        const targetHref =
          item.href === '/admin/withdrawals'
            ? '/admin/withdrawals?tab=processing'
            : item.href === '/admin/settlements'
              ? '/admin/settlements?tab=pending'
              : item.href;
        return (
          <Link
            key={item.href}
            href={targetHref}
            onClick={() => onItemClick?.(item.href)}
            className={`inline-flex items-center rounded-md font-medium transition-colors ${
              compact
                ? `shrink-0 whitespace-nowrap px-2.5 py-1.5 text-xs ${
                    active ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-200/80'
                  }`
                : `px-2.5 py-1.5 text-sm ${
                    active ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`
            }`}
          >
            {item.label}
            <NavBadge count={n} />
          </Link>
        );
      })}
    </>
  );
});

export default function AdminChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { me } = useAdminMe();
  const [badges, setBadges] = useState<AdminBadgeCounts | null>(null);

  const navItems = useMemo(() => {
    if (!me) return [];
    return ADMIN_NAV_ITEMS.filter((item) =>
      adminHasPermission(me.isSuperAdmin, me.permissions, item.permissionId)
    );
  }, [me]);

  useEffect(() => {
    let cancelled = false;
    let initialTimer: ReturnType<typeof setTimeout> | null = null;
    let inFlight = false;
    const load = () => {
      if (inFlight) return;
      inFlight = true;
      void (async () => {
        const local = await fetchAdminBadgeCounts({ includeExpensiveClientCounts: false });
        const server = await fetchAdminBadgeCountsFromServer();
        const merged: AdminBadgeCounts = {
          ...local,
          ...(server || {}),
        };
        // 서버 집계가 일시적으로 실패하면, 필요한 경우에만 비용 큰 클라이언트 계산을 보완한다.
        if (!server) {
          const fallback = await fetchAdminBadgeCounts({ includeExpensiveClientCounts: true });
          Object.assign(merged, fallback);
        }
        if (!cancelled) setBadges(merged);
      })().finally(() => {
        inFlight = false;
      });
    };
    // Defer first badge fetch slightly to improve first admin paint.
    initialTimer = setTimeout(load, 900);
    const interval = setInterval(load, 45000);
    window.addEventListener('focus', load);
    window.addEventListener(ADMIN_BADGES_REFRESH_EVENT, load);
    return () => {
      cancelled = true;
      if (initialTimer) clearTimeout(initialTimer);
      clearInterval(interval);
      window.removeEventListener('focus', load);
      window.removeEventListener(ADMIN_BADGES_REFRESH_EVENT, load);
    };
  }, []);

  const badgeByHref = useMemo(() => {
    if (!badges) return null;
    const m = new Map<string, number>();
    for (const item of ADMIN_NAV_ITEMS) {
      m.set(item.href, badgeCountForNav(item.href, badges));
    }
    return m;
  }, [badges]);

  const onLogout = useCallback(async () => {
    await logoutAdmin();
    router.replace('/admin/login');
  }, [router]);

  const onNavItemClick = useCallback(
    (href: string) => {
      if (typeof window === 'undefined') return;
      // 배지 제거는 각 페이지의 확인 탭 진입 시에만 처리한다.
    },
    []
  );

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-4 px-4 sm:px-6">
          <Link
            href="/admin"
            className="shrink-0 text-sm font-bold tracking-tight text-slate-900"
          >
            500 STAY <span className="text-slate-500">Admin</span>
          </Link>
          <nav
            className="hidden min-w-0 flex-1 flex-wrap items-center gap-1 lg:flex"
            aria-label="관리자 메뉴"
          >
            <AdminNavLinks
              compact={false}
              pathname={pathname}
              badgeByHref={badgeByHref}
              items={navItems}
              onItemClick={onNavItemClick}
            />
            {me?.isSuperAdmin ? (
              <Link
                href="/admin/admin-accounts"
                className={`inline-flex items-center rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors ${
                  pathname === '/admin/admin-accounts' ||
                  pathname?.startsWith('/admin/admin-accounts/')
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <UserCog className="mr-1 h-4 w-4" aria-hidden />
                관리자 계정
              </Link>
            ) : null}
          </nav>
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <LogOut className="h-4 w-4" aria-hidden />
              로그아웃
            </button>
          </div>
        </div>
        <div className="border-t border-slate-100 bg-slate-50/80 lg:hidden">
          <nav
            className="mx-auto flex max-w-[1600px] gap-1 overflow-x-auto px-4 py-2"
            aria-label="관리자 메뉴"
          >
            <AdminNavLinks
              compact
              pathname={pathname}
              badgeByHref={badgeByHref}
              items={navItems}
              onItemClick={onNavItemClick}
            />
            {me?.isSuperAdmin ? (
              <Link
                href="/admin/admin-accounts"
                className={`inline-flex shrink-0 items-center whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  pathname === '/admin/admin-accounts' ||
                  pathname?.startsWith('/admin/admin-accounts/')
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-200/80'
                }`}
              >
                <UserCog className="mr-1 h-4 w-4" aria-hidden />
                관리자 계정
              </Link>
            ) : null}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-5 sm:px-6 sm:py-6">
        <div className="rounded-lg border border-slate-200/90 bg-white p-4 shadow-sm sm:p-6">{children}</div>
      </main>
    </div>
  );
}
