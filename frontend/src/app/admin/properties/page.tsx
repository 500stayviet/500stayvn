'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminRouteGuard from '@/components/admin/AdminRouteGuard';
import { acknowledgeCurrentNewProperties, getUnseenNewPropertyCount } from '@/lib/adminAckState';
import { refreshAdminBadges } from '@/lib/adminBadgeCounts';
import { useAdminMe } from '@/contexts/AdminMeContext';
import type { AdminInventoryFilter } from '@/lib/api/properties';
import { loadAdminInventoryPage } from '@/lib/api/properties';
import { refreshUsersCacheForAdmin } from '@/lib/api/auth';
import { useAdminDomainRefresh } from '@/lib/adminDomainEventsClient';
import { setPropertyHidden } from '@/lib/api/adminModeration';
import type { PropertyData } from '@/types/property';

const PAGE_SIZE = 20;
const PROPERTY_HIDDEN_REASON = '법규를 위반했으니 관리자에게 문의 하시기 바랍니다';
const OWNER_BLOCKED_RESTORE_MESSAGE = '계정이 차단되어 있어 매물 숨김을 해제할 수 없습니다.';

const FILTER_TABS: { id: AdminInventoryFilter; label: string }[] = [
  { id: 'new', label: '신규' },
  { id: 'all', label: '전체' },
  { id: 'listed', label: '노출' },
  { id: 'paused', label: '광고종료' },
  { id: 'hidden', label: '숨김' },
];

function listingStatusLabel(p: PropertyData): { text: string; className: string } {
  if (p.hidden) {
    return { text: '숨김', className: 'bg-amber-100 text-amber-800' };
  }
  if (p.status === 'INACTIVE_SHORT_TERM') {
    return { text: '광고종료', className: 'bg-orange-100 text-orange-900' };
  }
  if (p.status === 'active') {
    return { text: '고객 노출', className: 'bg-emerald-100 text-emerald-800' };
  }
  return { text: p.status || '—', className: 'bg-slate-100 text-slate-700' };
}

export default function AdminPropertiesPage() {
  const router = useRouter();
  const { me: admin } = useAdminMe();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<AdminInventoryFilter>('all');
  const [tick, setTick] = useState(0);
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<PropertyData[]>([]);
  const [nAll, setNAll] = useState(0);
  const [nNew, setNNew] = useState(0);
  const [nListed, setNListed] = useState(0);
  const [nPaused, setNPaused] = useState(0);
  const [nHidden, setNHidden] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await loadAdminInventoryPage(query, filter);
        if (cancelled) return;
        setRows(res.rows);
        setNAll(res.nAll);
        setNNew(res.nNew);
        setNListed(res.nListed);
        setNPaused(res.nPaused);
        setNHidden(res.nHidden);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [query, filter, tick]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const pagedRows = useMemo(
    () => rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [rows, page]
  );

  const tabCount = (id: AdminInventoryFilter) =>
    id === 'all'
      ? nAll
      : id === 'new'
        ? nNew
        : id === 'listed'
          ? nListed
          : id === 'paused'
            ? nPaused
            : nHidden;
  const unseenNew = useMemo(() => getUnseenNewPropertyCount(), [tick, filter]);

  useEffect(() => {
    setPage(1);
  }, [query, filter]);

  useAdminDomainRefresh(['property', 'user'], () => {
    void refreshUsersCacheForAdmin().then(() => setTick((t) => t + 1));
  });

  useEffect(() => {
    if (filter !== 'new') return;
    acknowledgeCurrentNewProperties();
    refreshAdminBadges();
    setTick((t) => t + 1);
  }, [filter]);

  return (
    <AdminRouteGuard>
      <div>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-900">매물 관리</h1>
            <p className="text-sm text-slate-500">
              부모 매물만 표시 · 신규 24h · 전체 {nAll} · 신규 {nNew} · 노출(고객) {nListed} · 광고종료 {nPaused}{' '}
                · 숨김 {nHidden}
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
              {t.id === 'new' && unseenNew > 0 ? (
                <span className="ml-1 inline-flex min-h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white tabular-nums">
                  {unseenNew > 99 ? '99+' : unseenNew}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        <div className="mb-4 max-w-xl">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="id / 제목 / owner(UID·이메일) / 주소 검색"
            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
          />
          <p className="mt-1 text-xs text-slate-500">
            선택한 탭 안에서 검색됩니다. 노출 = 7일 예약 가능·고객 화면과 동일.
          </p>
        </div>

        {loading ? (
          <p className="py-12 text-center text-sm text-slate-500">불러오는 중…</p>
        ) : rows.length === 0 ? (
          <p className="py-12 text-center text-sm text-slate-500">조회 결과가 없습니다.</p>
        ) : (
          <div className="overflow-x-auto rounded-md border border-slate-200">
            <table className="w-full min-w-[880px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600">
                  <th className="px-3 py-2">제목</th>
                  <th className="px-3 py-2">주소</th>
                  <th className="px-3 py-2">Owner</th>
                  <th className="px-3 py-2">ID</th>
                  <th className="w-28 px-3 py-2">상태</th>
                  <th className="w-36 px-3 py-2 text-right">작업</th>
                </tr>
              </thead>
              <tbody>
                {pagedRows.map((p) => {
                  const st = listingStatusLabel(p);
                  return (
                    <tr
                      key={p.id}
                      className="cursor-pointer border-b border-slate-100 hover:bg-slate-50/80"
                      onClick={() => {
                        if (!p.id) return;
                        router.push(`/admin/properties/${encodeURIComponent(p.id)}`);
                      }}
                    >
                      <td className="max-w-[200px] truncate px-3 py-2 font-medium text-slate-900">
                        {p.title || '—'}
                      </td>
                      <td className="max-w-[220px] truncate px-3 py-2 text-slate-700">{p.address || '—'}</td>
                      <td className="max-w-[140px] truncate font-mono text-xs text-slate-600">{p.ownerId || '—'}</td>
                      <td className="max-w-[120px] truncate font-mono text-xs text-slate-500">{p.id || '—'}</td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${st.className}`}>
                          {st.text}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right">
                        {p.hidden ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!admin?.username || !p.id) return;
                              const ok = setPropertyHidden(p.id, false, admin!.username);
                              if (!ok) {
                                window.alert(OWNER_BLOCKED_RESTORE_MESSAGE);
                                return;
                              }
                              setTick((v) => v + 1);
                              refreshAdminBadges();
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
                              if (!admin?.username || !p.id) return;
                              setPropertyHidden(p.id, true, admin!.username, PROPERTY_HIDDEN_REASON);
                              setTick((v) => v + 1);
                              refreshAdminBadges();
                            }}
                            className="rounded-md bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-900 hover:bg-amber-100"
                          >
                            숨김
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && rows.length > 0 ? (
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

        <p className="mt-4 text-xs text-slate-400">숨김 사유(고정): {PROPERTY_HIDDEN_REASON}</p>
      </div>
    </AdminRouteGuard>
  );
}
