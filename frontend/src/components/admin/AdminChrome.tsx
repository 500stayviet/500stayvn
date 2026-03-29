'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { ADMIN_NAV_ITEMS } from '@/lib/adminNav';
import { logoutAdmin } from '@/lib/api/adminAuth';

function navActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  if (href === '/admin') {
    return pathname === '/admin' || pathname === '/admin/dashboard';
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AdminChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

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
            {ADMIN_NAV_ITEMS.map((item) => {
              const active = navActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors ${
                    active
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => {
                logoutAdmin();
                router.replace('/admin/login');
              }}
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
            {ADMIN_NAV_ITEMS.map((item) => {
              const active = navActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`shrink-0 rounded-md px-2.5 py-1.5 text-xs font-medium whitespace-nowrap ${
                    active
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-200/80'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-5 sm:px-6 sm:py-6">
        <div className="rounded-lg border border-slate-200/90 bg-white p-4 shadow-sm sm:p-6">{children}</div>
      </main>
    </div>
  );
}
