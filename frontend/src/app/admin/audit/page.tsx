'use client';

import { useMemo } from 'react';
import Link from 'next/link';
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
      <div className="min-h-screen bg-gray-100 flex justify-center">
        <div className="w-full max-w-[430px] min-h-screen bg-white shadow-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-900">감사 로그</h1>
            <Link href="/admin" className="text-sm text-blue-600">대시보드</Link>
          </div>
          <p className="text-xs text-gray-500 mb-4">금전 + 관리자 차단/숨김 이벤트 기록</p>
          <div className="space-y-2">
            {rows.length === 0 ? (
              <p className="text-sm text-gray-500 py-6 text-center">로그가 없습니다.</p>
            ) : (
              rows.map((r) => (
                <div key={r.id} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-900">{r.type}</p>
                    <p className={`text-sm font-bold ${r.amount >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {r.amount >= 0 ? '+' : ''}{r.amount.toLocaleString()} ₫
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">owner: {r.ownerId}</p>
                  <p className="text-xs text-gray-500">ref: {r.refId || '-'}</p>
                  <p className="text-xs text-gray-500">by: {r.createdBy || '-'}</p>
                  {r.note ? <p className="text-xs text-gray-500">note: {r.note}</p> : null}
                  <p className="text-xs text-gray-500">{new Date(r.createdAt).toLocaleString()}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AdminRouteGuard>
  );
}

