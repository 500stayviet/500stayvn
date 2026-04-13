'use client';

import { useEffect, useMemo, useState } from 'react';
import AdminRouteGuard from '@/components/admin/AdminRouteGuard';
import { AUDIT_TABS, buildUnifiedAuditRows, type AuditTabId } from '@/lib/adminAuditView';
import { getLedgerEntries } from '@/lib/api/adminFinance';
import { getModerationAudits } from '@/lib/api/adminModeration';
import { acknowledgeCurrentRecentAudit, getUnseenRecentAuditCount } from '@/lib/adminAckState';
import { refreshAdminBadges } from '@/lib/adminBadgeCounts';
import { useAdminDomainRefresh } from '@/lib/adminDomainEventsClient';

export default function AdminAuditPage() {
  const [tab, setTab] = useState<AuditTabId>('all');
  const [tick, setTick] = useState(0);
  const [nameByUsername, setNameByUsername] = useState<Record<string, string>>({});
  const [unseenNew, setUnseenNew] = useState(0);

  const rows = useMemo(() => {
    void tick;
    const ledger = getLedgerEntries();
    const moderation = getModerationAudits();
    return buildUnifiedAuditRows(ledger, moderation);
  }, [tick]);

  const filtered =
    tab === 'all'
      ? rows
      : tab === 'new'
        ? rows.filter((r) => Date.now() - new Date(r.createdAt).getTime() < 24 * 60 * 60 * 1000)
        : rows.filter((r) => r.category === tab);

  useEffect(() => {
    if (tab !== 'new') return;
    acknowledgeCurrentRecentAudit();
    refreshAdminBadges();
    setUnseenNew(0);
  }, [tab]);

  useEffect(() => {
    setUnseenNew(getUnseenRecentAuditCount());
  }, [tick]);

  useAdminDomainRefresh(
    ['audit', 'booking', 'payment', 'user', 'property'],
    () => setTick((t) => t + 1),
  );

  useEffect(() => {
    const resetToAll = () => setTab('all');
    window.addEventListener('admin-audit-reset-tab', resetToAll);
    return () => {
      window.removeEventListener('admin-audit-reset-tab', resetToAll);
    };
  }, []);

  useEffect(() => {
    let alive = true;
    const loadDirectory = async () => {
      const r = await fetch('/api/admin/accounts/directory', { credentials: 'include' });
      if (!r.ok) return;
      const j = (await r.json()) as { admins: Array<{ username: string; nickname: string }> };
      const map: Record<string, string> = {};
      for (const a of j.admins) {
        const username = (a.username || '').trim();
        if (!username) continue;
        const nick = (a.nickname || '').trim();
        map[username] = nick ? `${nick} (${username})` : username;
      }
      if (alive) setNameByUsername(map);
    };
    void loadDirectory();
    return () => {
      alive = false;
    };
  }, []);

  const actorLabel = (raw: string) => {
    const v = (raw || '').trim();
    if (!v || v === '-') return '-';
    return nameByUsername[v] || v;
  };

  return (
    <AdminRouteGuard>
      <div>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-900">감사 로그</h1>
            <p className="text-sm text-slate-500">금전 · 운영 조치 · 처리자·시각별 탭 구분</p>
          </div>
          <button
            type="button"
            onClick={() => setTick((n) => n + 1)}
            className="shrink-0 rounded-md bg-slate-100 px-4 py-2 text-sm font-medium hover:bg-slate-200"
          >
            새로고침
          </button>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {AUDIT_TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                tab === t.id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {t.label}
              <span className="ml-1 tabular-nums opacity-80">
                ({t.id === 'all'
                  ? rows.length
                  : t.id === 'new'
                    ? rows.filter((r) => Date.now() - new Date(r.createdAt).getTime() < 24 * 60 * 60 * 1000)
                        .length
                    : rows.filter((r) => r.category === t.id).length})
              </span>
              {t.id === 'new' && unseenNew > 0 ? (
                <span className="ml-1 inline-flex min-h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white tabular-nums">
                  {unseenNew > 99 ? '99+' : unseenNew}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <p className="py-12 text-center text-sm text-slate-500">이 탭에 로그가 없습니다.</p>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[800px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    <th className="px-2 py-2">조치</th>
                    <th className="px-2 py-2 text-right">금액</th>
                    <th className="px-2 py-2">owner / 대상</th>
                    <th className="px-2 py-2">ref</th>
                    <th className="px-2 py-2">처리자</th>
                    <th className="px-2 py-2">비고</th>
                    <th className="px-2 py-2">시각</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50/80">
                      <td className="px-2 py-1.5 font-medium text-slate-900">{r.actionLabel}</td>
                      <td
                        className={`px-2 py-1.5 text-right font-mono text-sm font-semibold ${
                          r.amount >= 0 ? 'text-emerald-600' : 'text-red-600'
                        }`}
                      >
                        {r.amount !== 0 ? (
                          <>
                            {r.amount >= 0 ? '+' : ''}
                            {r.amount.toLocaleString()} ₫
                          </>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="max-w-[120px] truncate px-2 py-1.5 font-mono text-xs text-slate-600">
                        {r.ownerId}
                      </td>
                      <td className="max-w-[100px] truncate px-2 py-1.5 font-mono text-xs text-slate-600">
                        {r.refId || '-'}
                      </td>
                      <td className="max-w-[150px] truncate px-2 py-1.5 text-xs text-slate-600">
                        {actorLabel(r.createdBy)}
                      </td>
                      <td className="max-w-[200px] truncate px-2 py-1.5 text-xs text-slate-500">
                        {r.note || '—'}
                      </td>
                      <td className="whitespace-nowrap px-2 py-1.5 text-xs text-slate-500">
                        {new Date(r.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="space-y-2 md:hidden">
              {filtered.map((r) => (
                <div key={r.id} className="rounded-md border border-slate-200 p-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-slate-900">{r.actionLabel}</p>
                    {r.amount !== 0 ? (
                      <p className={`font-bold ${r.amount >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {r.amount >= 0 ? '+' : ''}
                        {r.amount.toLocaleString()} ₫
                      </p>
                    ) : (
                      <span className="text-xs text-slate-400">금액 —</span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-slate-500">대상: {r.ownerId}</p>
                  <p className="text-xs text-slate-500">ref: {r.refId || '-'}</p>
                  <p className="text-xs text-slate-500">처리: {actorLabel(r.createdBy)}</p>
                  {r.note ? <p className="text-xs text-slate-500">비고: {r.note}</p> : null}
                  <p className="text-xs text-slate-500">{new Date(r.createdAt).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </AdminRouteGuard>
  );
}
