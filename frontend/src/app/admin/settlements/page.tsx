'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { CheckCircle2 } from 'lucide-react';
import AdminRouteGuard from '@/components/admin/AdminRouteGuard';
import AdminSettlementStyleCard from '@/components/admin/AdminSettlementStyleCard';
import { acknowledgeCurrentSettlementPending } from '@/lib/adminAckState';
import { refreshAdminBadges } from '@/lib/adminBadgeCounts';
import { getAdminSession } from '@/lib/api/adminAuth';
import {
  approveSettlement,
  getSettlementCandidates,
  SettlementCandidate,
  holdSettlement,
  resumeSettlement,
} from '@/lib/api/adminFinance';
import { filterSettlementsBySearch, getOwnerEmailMap } from '@/lib/adminSearchHelpers';

type SettlementTab = 'pending' | 'approved' | 'held';

const TABS: { id: SettlementTab; label: string }[] = [
  { id: 'pending', label: '승인 대기' },
  { id: 'approved', label: '승인 완료' },
  { id: 'held', label: '보류' },
];

export default function AdminSettlementsPage() {
  const [items, setItems] = useState<SettlementCandidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<SettlementTab>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const admin = getAdminSession();

  const load = async () => {
    setLoading(true);
    const rows = await getSettlementCandidates();
    setItems(rows);
    setLoading(false);
    refreshAdminBadges();
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (tab !== 'pending') return;
    void acknowledgeCurrentSettlementPending().then(() => refreshAdminBadges());
  }, [tab]);

  const needApproval = useMemo(() => items.filter((i) => i.approvalStatus === null), [items]);
  const approvedActive = useMemo(
    () => items.filter((i) => i.approvalStatus === 'approved'),
    [items]
  );
  const heldRows = useMemo(() => items.filter((i) => i.approvalStatus === 'held'), [items]);

  const activeList = useMemo(() => {
    if (tab === 'pending') return needApproval;
    if (tab === 'approved') return approvedActive;
    return heldRows;
  }, [tab, needApproval, approvedActive, heldRows]);

  const emailMap = useMemo(() => getOwnerEmailMap(), [items]);

  const filteredList = useMemo(
    () => filterSettlementsBySearch(activeList, searchQuery, emailMap),
    [activeList, searchQuery, emailMap]
  );

  const emptyMsg =
    tab === 'pending'
      ? '승인 대기 정산 건이 없습니다.'
      : tab === 'approved'
        ? '승인 완료(활성) 건이 없습니다.'
        : '보류 중인 정산 건이 없습니다.';

  const column = (list: SettlementCandidate[], body: ReactNode) => (
    <div className="flex min-h-0 max-h-[min(75vh,920px)] flex-col overflow-y-auto rounded-lg border border-slate-200 bg-slate-50/40">
      <div className="space-y-2 p-2">
        {list.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-500">{emptyMsg}</p>
        ) : (
          body
        )}
      </div>
    </div>
  );

  const card = (row: SettlementCandidate, amountClass: string, actions: ReactNode) => {
    const email = emailMap.get(row.ownerId) || '—';
    const addressLine = (row.propertyAddress || '').trim() || row.propertyTitle || '—';
    return (
      <AdminSettlementStyleCard
        key={row.bookingId}
        checkInDate={row.checkInDate}
        checkOutDate={row.checkOutDate}
        addressLine={addressLine}
        email={email}
        ownerUid={row.ownerId}
        amount={row.amount}
        amountClassName={amountClass}
        footer={actions}
      />
    );
  };

  return (
    <AdminRouteGuard>
      <div>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-900">정산 승인</h1>
            <p className="text-sm text-slate-500">
              체크아웃+24시간 후 승인 시 출금 가능 금액에 반영됩니다. · 대기 {needApproval.length} · 완료{' '}
              {approvedActive.length} · 보류 {heldRows.length}
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

        <div className="mb-4 flex flex-wrap gap-2">
          {TABS.map((t) => (
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
                (
                {t.id === 'pending'
                  ? needApproval.length
                  : t.id === 'approved'
                    ? approvedActive.length
                    : heldRows.length}
                )
              </span>
            </button>
          ))}
        </div>

        <div className="mb-4">
          <label htmlFor="settlement-search" className="sr-only">
            검색
          </label>
          <input
            id="settlement-search"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="이메일, UID, 예약·매물명, 금액…"
            className="w-full max-w-md rounded-md border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400"
          />
          <p className="mt-1 text-xs text-slate-500">
            선택한 탭(승인 대기·승인 완료·보류) 안에서만 검색됩니다.
          </p>
        </div>

        {column(
          filteredList,
          filteredList.map((row) => {
            if (tab === 'pending') {
              return card(
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
              );
            }
            if (tab === 'approved') {
              return card(
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
              );
            }
            return card(
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
            );
          })
        )}
      </div>
    </AdminRouteGuard>
  );
}
