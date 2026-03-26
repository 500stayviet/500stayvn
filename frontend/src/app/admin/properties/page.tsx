'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import AdminRouteGuard from '@/components/admin/AdminRouteGuard';
import { getAdminSession } from '@/lib/api/adminAuth';
import { getAdminProperties, setPropertyHidden } from '@/lib/api/adminModeration';

type FilterType = 'all' | 'active' | 'hidden';

export default function AdminPropertiesPage() {
  const PAGE_SIZE = 10;
  const PROPERTY_HIDDEN_REASON = '법규를 위반했으니 관리자에게 문의 하시기 바랍니다';
  const admin = getAdminSession();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [tick, setTick] = useState(0);
  const [page, setPage] = useState(1);

  const rows = useMemo(() => getAdminProperties(query, filter), [query, filter, tick]);
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
            <h1 className="text-xl font-bold text-gray-900">매물 관리</h1>
            <Link href="/admin" className="text-sm text-blue-600">
              대시보드
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-3">
            {(['all', 'active', 'hidden'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`py-2 rounded-lg text-sm font-semibold ${
                  filter === f ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                {f === 'all' ? '전체' : f === 'active' ? '노출' : '숨김'}
              </button>
            ))}
          </div>

          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="id / 제목 / owner / 주소 검색"
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 mb-4 outline-none focus:ring-2 focus:ring-blue-200"
          />

          <div className="space-y-3">
            {rows.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">조회 결과가 없습니다.</p>
            ) : (
              pagedRows.map((p) => (
                <div key={p.id} className="border border-gray-200 rounded-xl p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {p.title || '제목 없음'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{p.address || '-'}</p>
                      <p className="text-xs text-gray-500 truncate mt-0.5">owner: {p.ownerId || '-'}</p>
                      <p className="text-xs text-gray-500 truncate">{p.id || '-'}</p>
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        p.hidden ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {p.hidden ? '숨김' : '노출'}
                    </span>
                  </div>

                  <div className="mt-3">
                    {p.hidden ? (
                      <button
                        onClick={() => {
                          if (!admin?.username || !p.id) return;
                          setPropertyHidden(p.id, false, admin.username);
                          setTick((v) => v + 1);
                        }}
                        className="w-full py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
                      >
                        복구(노출)
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          if (!admin?.username || !p.id) return;
                          setPropertyHidden(p.id, true, admin.username, PROPERTY_HIDDEN_REASON);
                          setTick((v) => v + 1);
                        }}
                        className="w-full py-2 rounded-lg bg-amber-50 text-amber-700 text-sm font-semibold hover:bg-amber-100"
                      >
                        숨김
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

