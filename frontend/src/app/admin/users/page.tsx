'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import AdminRouteGuard from '@/components/admin/AdminRouteGuard';
import { getAdminSession } from '@/lib/api/adminAuth';
import { getAdminUsers, setUserBlocked } from '@/lib/api/adminModeration';

type FilterType = 'all' | 'active' | 'blocked';

export default function AdminUsersPage() {
  const PAGE_SIZE = 10;
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
      <div className="min-h-screen bg-gray-100 flex justify-center">
        <div className="w-full max-w-[430px] min-h-screen bg-white shadow-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-900">계정 관리</h1>
            <Link href="/admin" className="text-sm text-blue-600">
              대시보드
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-3">
            {(['all', 'active', 'blocked'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`py-2 rounded-lg text-sm font-semibold ${
                  filter === f ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                {f === 'all' ? '전체' : f === 'active' ? '정상' : '차단'}
              </button>
            ))}
          </div>

          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="uid / email / 이름 검색"
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 mb-4 outline-none focus:ring-2 focus:ring-blue-200"
          />

          <div className="space-y-3">
            {rows.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">조회 결과가 없습니다.</p>
            ) : (
              pagedRows.map((u) => (
                <div key={u.uid} className="border border-gray-200 rounded-xl p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {u.displayName || '이름 없음'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{u.email}</p>
                      <p className="text-xs text-gray-500 truncate mt-0.5">{u.uid}</p>
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        u.blocked ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {u.blocked ? '차단' : '정상'}
                    </span>
                  </div>

                  <div className="mt-3">
                    {u.blocked ? (
                      <button
                        onClick={() => {
                          if (!admin?.username) return;
                          setUserBlocked(u.uid, false, admin.username);
                          setTick((v) => v + 1);
                        }}
                        className="w-full py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
                      >
                        복구(차단 해제)
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          if (!admin?.username) return;
                          const reason = window.prompt('차단 사유를 입력하세요.', '관리자 차단') || '관리자 차단';
                          setUserBlocked(u.uid, true, admin.username, reason);
                          setTick((v) => v + 1);
                        }}
                        className="w-full py-2 rounded-lg bg-red-50 text-red-600 text-sm font-semibold hover:bg-red-100"
                      >
                        차단
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {rows.length > 0 ? (
            <div className="mt-4 flex items-center justify-between">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 rounded-lg bg-gray-100 text-sm disabled:opacity-40"
              >
                이전
              </button>
              <p className="text-xs text-gray-500">
                {page} / {totalPages}
              </p>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 rounded-lg bg-gray-100 text-sm disabled:opacity-40"
              >
                다음
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </AdminRouteGuard>
  );
}

