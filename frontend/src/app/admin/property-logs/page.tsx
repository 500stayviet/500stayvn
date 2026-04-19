'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import AdminRouteGuard from '@/components/admin/AdminRouteGuard';
import { useAdminDomainRefresh } from '@/lib/adminDomainEventsClient';
import {
  ensureAdminPropertyActionLogsLoaded,
  getAdminPropertyActionLogsCached,
  invalidateAdminPropertyActionLogsCache,
} from '@/lib/api/adminPropertyActionLogs';
import type { AdminPropertyActionLogRow, PropertyActionType } from '@/lib/api/adminPropertyActionLogs';

function formatWhen(v: Date | string): string {
  try {
    const d = typeof v === 'string' ? new Date(v) : v;
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString('ko-KR');
  } catch {
    return '—';
  }
}

export default function AdminPropertyLogsPage() {
  const [tick, setTick] = useState(0);
  const [tab, setTab] = useState<PropertyActionType | 'ALL'>('ALL');

  const bump = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let alive = true;
    void ensureAdminPropertyActionLogsLoaded().then(() => {
      if (alive) bump();
    });
    return () => {
      alive = false;
    };
  }, [bump]);

  useAdminDomainRefresh(['property'], () => {
    invalidateAdminPropertyActionLogsCache();
    void ensureAdminPropertyActionLogsLoaded().then(() => bump());
  });

  const rows = useMemo(() => {
    void tick;
    const all = getAdminPropertyActionLogsCached();
    if (tab === 'ALL') return all;
    return all.filter((r) => r.actionType === tab);
  }, [tick, tab]);

  return (
    <AdminRouteGuard>
      <div className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-900">매물 삭제·취소 이력</h1>
            <p className="text-sm text-slate-500">
              서버 DB 원장 — 영구 삭제(DELETED) 및 예약 취소 시 매물 기록(CANCELLED)
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              invalidateAdminPropertyActionLogsCache();
              void ensureAdminPropertyActionLogsLoaded().then(() => bump());
            }}
            className="shrink-0 rounded-md bg-slate-100 px-4 py-2 text-sm font-medium hover:bg-slate-200"
          >
            새로고침
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {(['ALL', 'DELETED', 'CANCELLED'] as const).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                tab === id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {id === 'ALL' ? '전체' : id === 'DELETED' ? '영구 삭제' : '예약 취소'}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600">
                <th className="px-2 py-2">시각</th>
                <th className="px-2 py-2">유형</th>
                <th className="px-2 py-2">propertyId</th>
                <th className="px-2 py-2">ownerId</th>
                <th className="px-2 py-2">기록자</th>
                <th className="px-2 py-2">reservation</th>
                <th className="px-2 py-2">비고</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-10 text-center text-slate-500">
                    기록이 없습니다.
                  </td>
                </tr>
              ) : (
                rows.map((r: AdminPropertyActionLogRow) => (
                  <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50/80">
                    <td className="whitespace-nowrap px-2 py-1.5 text-xs text-slate-600">{formatWhen(r.createdAt)}</td>
                    <td className="px-2 py-1.5 font-mono text-xs">{r.actionType}</td>
                    <td className="max-w-[140px] truncate px-2 py-1.5 font-mono text-xs">{r.propertyId}</td>
                    <td className="max-w-[120px] truncate px-2 py-1.5 font-mono text-xs">{r.ownerId || '—'}</td>
                    <td className="max-w-[120px] truncate px-2 py-1.5 font-mono text-xs">{r.adminId || '—'}</td>
                    <td className="max-w-[120px] truncate px-2 py-1.5 font-mono text-xs">{r.reservationId || '—'}</td>
                    <td className="max-w-[200px] truncate px-2 py-1.5 text-xs text-slate-500">{r.reason || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminRouteGuard>
  );
}
