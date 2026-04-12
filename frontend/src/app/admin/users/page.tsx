'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AdminRouteGuard from '@/components/admin/AdminRouteGuard';
import { acknowledgeCurrentNewUsers } from '@/lib/adminAckState';
import { refreshAdminBadges } from '@/lib/adminBadgeCounts';
import { useAdminMe } from '@/contexts/AdminMeContext';
import type { AdminUserFilter } from '@/lib/api/adminModeration';
import { getAdminUsers, setUserBlocked } from '@/lib/api/adminModeration';
import { refreshUsersCacheForAdmin } from '@/lib/api/auth';
import { useAdminDomainRefresh } from '@/lib/adminDomainEventsClient';

const PAGE_SIZE = 20;

const FILTER_TABS: { id: AdminUserFilter; label: string }[] = [
  { id: 'new', label: '신규' },
  { id: 'all', label: '전체' },
  { id: 'active', label: '정상' },
  { id: 'blocked', label: '차단' },
];

export default function AdminUsersPage() {
  const router = useRouter();
  const { me: admin } = useAdminMe();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<AdminUserFilter>('all');
  const [tick, setTick] = useState(0);
  const [page, setPage] = useState(1);

  const rows = useMemo(() => getAdminUsers(query, filter), [query, filter, tick]);
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const pagedRows = useMemo(
    () => rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [rows, page]
  );

  const nAll = useMemo(() => getAdminUsers(query, 'all').length, [query, tick]);
  const nNew = useMemo(() => getAdminUsers(query, 'new').length, [query, tick]);
  const nActive = useMemo(() => getAdminUsers(query, 'active').length, [query, tick]);
  const nBlocked = useMemo(() => getAdminUsers(query, 'blocked').length, [query, tick]);

  const tabCount = (id: AdminUserFilter) =>
    id === 'all' ? nAll : id === 'new' ? nNew : id === 'active' ? nActive : nBlocked;

  useEffect(() => {
    setPage(1);
  }, [query, filter]);

  useAdminDomainRefresh(['user', 'lessor_profile'], () => {
    void refreshUsersCacheForAdmin().then(() => setTick((t) => t + 1));
  });

  useEffect(() => {
    if (filter !== 'new') return;
    acknowledgeCurrentNewUsers();
    refreshAdminBadges();
  }, [filter]);

  return (
    <AdminRouteGuard>
      <div>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-900">계정 관리</h1>
            <p className="text-sm text-slate-500">
              신규는 가입 후 24시간 이내 · 신규 {nNew} · 전체 {nAll} · 정상 {nActive} · 차단 {nBlocked}
            </p>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {FILTER_TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setFilter(t.id)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                filter === t.id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {t.label}
              <span className="ml-1 tabular-nums opacity-80">({tabCount(t.id)})</span>
            </button>
          ))}
        </div>

        <div className="mb-4 max-w-xl">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="uid / email / 이름 검색"
            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
          />
          <p className="mt-1 text-xs text-slate-500">
            선택한 탭(신규·전체·정상·차단) 안에서만 검색됩니다.
          </p>
        </div>

        {rows.length === 0 ? (
          <p className="py-12 text-center text-sm text-slate-500">조회 결과가 없습니다.</p>
        ) : (
          <div className="overflow-x-auto rounded-md border border-slate-200">
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600">
                  <th className="px-3 py-2">이름</th>
                  <th className="px-3 py-2">이메일</th>
                  <th className="px-3 py-2">전화번호</th>
                  <th className="px-3 py-2">UID</th>
                  <th className="w-24 px-3 py-2">상태</th>
                  <th className="w-48 px-3 py-2 text-right">작업</th>
                </tr>
              </thead>
              <tbody>
                {pagedRows.map((u) => (
                  <tr
                    key={u.uid}
                    className="cursor-pointer border-b border-slate-100 hover:bg-slate-50/80"
                    onClick={() => {
                      router.push(`/admin/users/${encodeURIComponent(u.uid)}`);
                    }}
                  >
                    <td className="px-3 py-2 font-medium text-slate-900">{u.displayName || '—'}</td>
                    <td className="max-w-[200px] truncate px-3 py-2 text-slate-700">{u.email}</td>
                    <td className="max-w-[120px] truncate px-3 py-2 text-slate-700">{u.phoneNumber || '—'}</td>
                    <td className="max-w-[180px] truncate font-mono text-xs text-slate-600">{u.uid}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          u.blocked ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {u.blocked ? '차단' : '정상'}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex flex-wrap items-center justify-end gap-1.5">
                        {u.blocked ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!admin?.username) return;
                              void (async () => {
                                await setUserBlocked(u.uid, false, admin.username);
                                setTick((v) => v + 1);
                                refreshAdminBadges();
                              })();
                            }}
                            className="rounded-md bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-blue-700"
                          >
                            복구
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!admin?.username) return;
                              const reason =
                                window.prompt('차단 사유를 입력하세요.', '관리자 차단') || '관리자 차단';
                              void (async () => {
                                await setUserBlocked(u.uid, true, admin!.username, reason);
                                setTick((v) => v + 1);
                                refreshAdminBadges();
                              })();
                            }}
                            className="rounded-md bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-100"
                          >
                            차단
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {rows.length > 0 ? (
          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-md bg-slate-100 px-3 py-1.5 text-sm disabled:opacity-40"
            >
              이전
            </button>
            <p className="font-mono text-xs text-slate-600">
              {page} / {totalPages} · {rows.length}건
            </p>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="rounded-md bg-slate-100 px-3 py-1.5 text-sm disabled:opacity-40"
            >
              다음
            </button>
          </div>
        ) : null}
      </div>
    </AdminRouteGuard>
  );
}
