'use client';

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import AdminRouteGuard from '@/components/admin/AdminRouteGuard';
import AdminSettlementStyleCard from '@/components/admin/AdminSettlementStyleCard';
import { filterBookingsBySearch, useOwnerEmailMap } from '@/lib/adminSearchHelpers';
import { ADMIN_NEW_MS } from '@/lib/adminNewUtils';
import {
  isRefundBeforeRental,
  isRefundDuringOrAfterRental,
} from '@/lib/adminBookingFilters';
import type { BookingData } from '@/lib/api/bookings';
import { approveRefundBooking, getAllBookingsForAdmin } from '@/lib/api/bookings';
import { useAdminMe } from '@/contexts/AdminMeContext';
import { refreshAdminBadges } from '@/lib/adminBadgeCounts';
import { acknowledgeCurrentNewRefunds } from '@/lib/adminAckState';
import { useAdminDomainRefresh } from '@/lib/adminDomainEventsClient';

type RefundTab = 'all' | 'new' | 'pre' | 'during';

const TABS: { id: RefundTab; label: string }[] = [
  { id: 'new', label: '신규' },
  { id: 'all', label: '전체' },
  { id: 'pre', label: '계약전 환불' },
  { id: 'during', label: '계약진행중 환불' },
];

export default function AdminRefundsPage() {
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<RefundTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { me: admin } = useAdminMe();

  const load = useCallback(async () => {
    setLoading(true);
    const rows = await getAllBookingsForAdmin();
    setBookings(rows);
    setLoading(false);
    refreshAdminBadges();
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useAdminDomainRefresh(['booking', 'payment'], () => {
    void load();
  });

  const preList = useMemo(() => bookings.filter(isRefundBeforeRental), [bookings]);
  const duringList = useMemo(() => bookings.filter(isRefundDuringOrAfterRental), [bookings]);
  const allList = useMemo(() => [...preList, ...duringList], [preList, duringList]);
  const newList = useMemo(() => {
    const now = Date.now();
    return allList.filter((b) => {
      const t = new Date(b.updatedAt || b.cancelledAt || b.createdAt || 0).getTime();
      return Number.isFinite(t) && now - t < ADMIN_NEW_MS;
    });
  }, [allList]);

  const activeList = tab === 'all' ? allList : tab === 'new' ? newList : tab === 'pre' ? preList : duringList;

  const emailMap = useOwnerEmailMap(bookings);

  const filteredList = useMemo(
    () => filterBookingsBySearch(activeList, searchQuery, emailMap),
    [activeList, searchQuery, emailMap]
  );

  const emptyMsg =
    tab === 'all'
      ? '환불 대기 건이 없습니다.'
      : tab === 'new'
      ? '신규 환불 대기 건이 없습니다.'
      : tab === 'pre'
        ? '계약전 환불 대기 건이 없습니다.'
        : '계약진행중 환불 대기 건이 없습니다.';

  useEffect(() => {
    const resetToAll = () => setTab('all');
    window.addEventListener('admin-refunds-reset-tab', resetToAll);
    return () => {
      window.removeEventListener('admin-refunds-reset-tab', resetToAll);
    };
  }, []);

  useEffect(() => {
    if (tab !== 'new') return;
    void (async () => {
      await acknowledgeCurrentNewRefunds();
      refreshAdminBadges();
    })();
  }, [tab]);

  const column = (list: BookingData[], body: ReactNode) => (
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

  return (
    <AdminRouteGuard>
      <div>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-900">환불</h1>
            <p className="text-sm text-slate-500">
              취소되었고 결제완료 상태인 건의 환불을 승인합니다. · 계약전 {preList.length} · 진행중{' '}
              {duringList.length}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void load()}
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
                ({t.id === 'all' ? allList.length : t.id === 'new' ? newList.length : t.id === 'pre' ? preList.length : duringList.length})
              </span>
            </button>
          ))}
        </div>

        <div className="mb-4">
          <label htmlFor="refund-search" className="sr-only">
            검색
          </label>
          <input
            id="refund-search"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="이메일, UID, 예약·매물명, 금액…"
            className="w-full max-w-md rounded-md border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400"
          />
          <p className="mt-1 text-xs text-slate-500">
            선택한 탭(계약전·계약진행중) 안에서만 검색됩니다.
          </p>
        </div>

        {column(
          filteredList,
          filteredList.map((b) => {
            const email = emailMap.get(b.ownerId) || '—';
            const addressLine =
              (b.propertyAddress || '').trim() || b.propertyTitle || '—';
            const id = b.id ?? '';
            return (
              <AdminSettlementStyleCard
                key={id}
                checkInDate={b.checkInDate}
                checkOutDate={b.checkOutDate}
                addressLine={addressLine}
                email={email}
                ownerUid={b.ownerId}
                amount={b.totalPrice}
                amountClassName="text-amber-700"
                footer={
                  <button
                    type="button"
                    onClick={async () => {
                      if (!admin?.username || !id) return;
                      const ok = await approveRefundBooking(id, admin!.username);
                      if (ok) await load();
                    }}
                    className="mt-2 w-full rounded-md bg-blue-600 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                  >
                    환불 승인
                  </button>
                }
              />
            );
          })
        )}
      </div>
    </AdminRouteGuard>
  );
}
