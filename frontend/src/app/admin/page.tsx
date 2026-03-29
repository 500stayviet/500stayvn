'use client';

import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import AdminRouteGuard from '@/components/admin/AdminRouteGuard';
import { ADMIN_NAV_ITEMS } from '@/lib/adminNav';

export default function AdminPage() {
  return (
    <AdminRouteGuard>
      <div>
        <div className="mb-5 flex flex-col gap-1 border-b border-slate-100 pb-4">
          <h1 className="text-lg font-bold text-slate-900 sm:text-xl">관리자 대시보드</h1>
          <p className="text-sm text-slate-500">업무 메뉴를 선택하세요. 상단 바에서도 이동할 수 있습니다.</p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {ADMIN_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group flex items-start justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50/50 p-4 transition-colors hover:border-slate-300 hover:bg-white"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-slate-200/80">
                    <Icon className="h-5 w-5 text-slate-700" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">{item.label}</p>
                    <p className="mt-0.5 text-xs leading-snug text-slate-500">{item.description}</p>
                  </div>
                </div>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            );
          })}
        </div>
      </div>
    </AdminRouteGuard>
  );
}
