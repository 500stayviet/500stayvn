'use client';

import { useEffect, useMemo, useState } from 'react';
import AdminRouteGuard from '@/components/admin/AdminRouteGuard';
import { getAdminSession } from '@/lib/api/adminAuth';
import { getAdminUsers, setUserBlocked } from '@/lib/api/adminModeration';

type FilterType = 'all' | 'active' | 'blocked';

const PAGE_SIZE = 20;

export default function AdminUsersPage() {
  const admin = getAdminSession();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [tick, setTick] = useState(0);
  const [page, setPage] = useState(1);

  const rows = useMemo(() => getAdminUsers(query, filter), [query, filter, tick]);
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const pagedRows = useMemo(
    () => rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [rows, page]
  );

  useEffect(() => {
    setPage(1);
  }, [query, filter]);

  return (
    <AdminRouteGuard>
      <div>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-900">계정 관리</h1>
            <p className="text-sm text-slate-500">차단·복구 및 검색 · 총 {rows.length}건</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(['all', 'active', 'blocked'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                  filter === f ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {f === 'all' ? '전체' : f === 'active' ? '정상' : '차단'}
              </button>
            ))}
          </div>
        </div>

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="uid / email / 이름 검색"
          className="mb-4 w-full max-w-xl rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
        />

        {rows.length === 0 ? (
          <p className="py-12 text-center text-sm text-slate-500">조회 결과가 없습니다.</p>
        ) : (
          <div className="overflow-x-auto rounded-md border border-slate-200">
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600">
                  <th className="px-3 py-2">이름</th>
                  <th className="px-3 py-2">이메일</th>
                  <th className="px-3 py-2">UID</th>
                  <th className="w-24 px-3 py-2">상태</th>
                  <th className="w-40 px-3 py-2 text-right">작업</th>
                </tr>
              </thead>
              <tbody>
                {pagedRows.map((u) => (
                  <tr key={u.uid} className="border-b border-slate-100 hover:bg-slate-50/80">
                    <td className="px-3 py-2 font-medium text-slate-900">{u.displayName || '—'}</td>
                    <td className="max-w-[200px] truncate px-3 py-2 text-slate-700">{u.email}</td>
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
                      {u.blocked ? (
                        <button
                          type="button"
                          onClick={() => {
                            if (!admin?.username) return;
                            setUserBlocked(u.uid, false, admin.username);
                            setTick((v) => v + 1);
                          }}
                          className="rounded-md bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-blue-700"
                        >
                          복구
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            if (!admin?.username) return;
                            const reason =
                              window.prompt('차단 사유를 입력하세요.', '관리자 차단') || '관리자 차단';
                            setUserBlocked(u.uid, true, admin.username, reason);
                            setTick((v) => v + 1);
                          }}
                          className="rounded-md bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-100"
                        >
                          차단
                        </button>
                      )}
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
