'use client';

import { useMemo } from 'react';
import AdminRouteGuard from '@/components/admin/AdminRouteGuard';
import { getLedgerEntries } from '@/lib/api/adminFinance';
import { getModerationAudits } from '@/lib/api/adminModeration';

export default function AdminAuditPage() {
  const rows = useMemo(() => {
    const financeRows = getLedgerEntries().map((r) => ({
      id: r.id,
      type: r.type,
      amount: r.amount,
      ownerId: r.ownerId,
      refId: r.refId || '-',
      createdBy: r.createdBy || '-',
      createdAt: r.createdAt,
      note: r.note || '',
    }));
    const moderationRows = getModerationAudits().map((r) => ({
      id: r.id,
      type: r.action,
      amount: 0,
      ownerId: r.ownerId || '-',
      refId: r.targetId,
      createdBy: r.createdBy,
      createdAt: r.createdAt,
      note: r.reason || '',
    }));
    return [...financeRows, ...moderationRows].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, []);

  return (
    <AdminRouteGuard>
      <div>
        <div className="mb-4">
          <h1 className="text-lg font-bold text-slate-900">감사 로그</h1>
          <p className="text-sm text-slate-500">금전 · 차단·숨김 이벤트 · 최신순</p>
        </div>

        {rows.length === 0 ? (
          <p className="py-12 text-center text-sm text-slate-500">로그가 없습니다.</p>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[800px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    <th className="px-2 py-2">유형</th>
                    <th className="px-2 py-2 text-right">금액</th>
                    <th className="px-2 py-2">owner</th>
                    <th className="px-2 py-2">ref</th>
                    <th className="px-2 py-2">by</th>
                    <th className="px-2 py-2">비고</th>
                    <th className="px-2 py-2">시각</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50/80">
                      <td className="px-2 py-1.5 font-medium text-slate-900">{r.type}</td>
                      <td
                        className={`px-2 py-1.5 text-right font-mono text-sm font-semibold ${
                          r.amount >= 0 ? 'text-emerald-600' : 'text-red-600'
                        }`}
                      >
                        {r.amount >= 0 ? '+' : ''}
                        {r.amount.toLocaleString()} ₫
                      </td>
                      <td className="max-w-[120px] truncate px-2 py-1.5 font-mono text-xs text-slate-600">
                        {r.ownerId}
                      </td>
                      <td className="max-w-[100px] truncate px-2 py-1.5 font-mono text-xs text-slate-600">
                        {r.refId || '-'}
                      </td>
                      <td className="max-w-[90px] truncate px-2 py-1.5 text-xs text-slate-600">
                        {r.createdBy || '-'}
                      </td>
                      <td className="max-w-[180px] truncate px-2 py-1.5 text-xs text-slate-500">
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
              {rows.map((r) => (
                <div key={r.id} className="rounded-md border border-slate-200 p-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-slate-900">{r.type}</p>
                    <p className={`font-bold ${r.amount >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {r.amount >= 0 ? '+' : ''}
                      {r.amount.toLocaleString()} ₫
                    </p>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">owner: {r.ownerId}</p>
                  <p className="text-xs text-slate-500">ref: {r.refId || '-'}</p>
                  <p className="text-xs text-slate-500">by: {r.createdBy || '-'}</p>
                  {r.note ? <p className="text-xs text-slate-500">note: {r.note}</p> : null}
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
