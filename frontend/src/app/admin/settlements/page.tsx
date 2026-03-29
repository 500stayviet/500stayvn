'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { CheckCircle2 } from 'lucide-react';
import AdminRouteGuard from '@/components/admin/AdminRouteGuard';
import { getAdminSession } from '@/lib/api/adminAuth';
import {
  approveSettlement,
  getSettlementCandidates,
  SettlementCandidate,
  holdSettlement,
  resumeSettlement,
} from '@/lib/api/adminFinance';

export default function AdminSettlementsPage() {
  const [items, setItems] = useState<SettlementCandidate[]>([]);
  const [loading, setLoading] = useState(false);
  const admin = getAdminSession();

  const load = async () => {
    setLoading(true);
    const rows = await getSettlementCandidates();
    setItems(rows);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const needApproval = useMemo(() => items.filter((i) => i.approvalStatus === null), [items]);
  const approvedActive = useMemo(
    () => items.filter((i) => i.approvalStatus === 'approved'),
    [items]
  );
  const heldRows = useMemo(() => items.filter((i) => i.approvalStatus === 'held'), [items]);

  const column = (title: string, empty: string, list: SettlementCandidate[], body: ReactNode) => (
    <div className="flex min-h-0 flex-col rounded-lg border border-slate-200 bg-slate-50/40 lg:max-h-[min(75vh,920px)] lg:overflow-y-auto">
      <h2 className="sticky top-0 z-10 border-b border-slate-200 bg-white px-3 py-2 text-xs font-bold uppercase tracking-wide text-slate-600">
        {title}
      </h2>
      <div className="space-y-2 p-2">
        {list.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">{empty}</p>
        ) : (
          body
        )}
      </div>
    </div>
  );

  const card = (row: SettlementCandidate, amountClass: string, actions: ReactNode) => (
    <div key={row.bookingId} className="rounded-md border border-slate-200 bg-white p-3 text-sm shadow-sm">
      <p className="font-semibold text-slate-900">{row.propertyTitle || 'Untitled'}</p>
      <p className="mt-0.5 font-mono text-[11px] text-slate-500">
        {row.checkInDate} ~ {row.checkOutDate}
      </p>
      <p className="mt-1 text-slate-700">Owner: {row.ownerId}</p>
      <p className={`mt-1.5 text-base font-bold ${amountClass}`}>{row.amount.toLocaleString()} ₫</p>
      {actions}
    </div>
  );

  return (
    <AdminRouteGuard>
      <div>
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-900">정산 승인</h1>
            <p className="text-sm text-slate-500">
              체크아웃+24시간 후 승인 시 출금 가능 금액에 반영됩니다.
            </p>
          </div>
          <button
            type="button"
            onClick={load}
            className="shrink-0 rounded-md bg-slate-100 px-4 py-2 text-sm font-medium hover:bg-slate-200"
          >
            {loading ? '불러오는 중...' : '새로고침'}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:items-start">
          {column('승인 대기', '승인 대기 정산 건이 없습니다.', needApproval, needApproval.map((row) =>
            card(
              row,
              'text-emerald-600',
              <button
                type="button"
                onClick={() => {
                  if (!admin?.username) return;
                  const ok = approveSettlement(row, admin.username);
                  if (!ok) return;
                  load();
                }}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 py-2 text-xs font-semibold text-white hover:bg-blue-700"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                승인 후 반영
              </button>
            )
          ))}

          {column('승인 완료', '활성 승인 건이 없습니다.', approvedActive, approvedActive.map((row) =>
            card(
              row,
              'text-emerald-600',
              <button
                type="button"
                onClick={() => {
                  if (!admin?.username) return;
                  holdSettlement(row.bookingId, admin.username, '관리자 홀딩');
                  load();
                }}
                className="mt-2 w-full rounded-md bg-amber-50 py-2 text-xs font-semibold text-amber-900 hover:bg-amber-100"
              >
                홀딩
              </button>
            )
          ))}

          {column('보류', '보류 건이 없습니다.', heldRows, heldRows.map((row) =>
            card(
              row,
              'text-amber-600',
              <button
                type="button"
                onClick={() => {
                  if (!admin?.username) return;
                  resumeSettlement(row.bookingId, admin.username);
                  load();
                }}
                className="mt-2 w-full rounded-md bg-blue-600 py-2 text-xs font-semibold text-white hover:bg-blue-700"
              >
                재개
              </button>
            )
          ))}
        </div>
      </div>
    </AdminRouteGuard>
  );
}
