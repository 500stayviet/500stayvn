'use client';

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import AdminRouteGuard from '@/components/admin/AdminRouteGuard';
import AdminSettlementStyleCard from '@/components/admin/AdminSettlementStyleCard';
import { filterBookingsBySearch, useOwnerEmailMap } from '@/lib/adminSearchHelpers';
import { ADMIN_NEW_MS } from '@/lib/adminNewUtils';
import {
  isContractCompletedTab,
  isContractInProgressTab,
  isContractSealedTab,
} from '@/lib/adminBookingFilters';
import type { BookingData } from '@/lib/api/bookings';
import { getAllBookingsForAdmin } from '@/lib/api/bookings';
import { acknowledgeCurrentNewContracts } from '@/lib/adminAckState';
import { refreshAdminBadges } from '@/lib/adminBadgeCounts';
import { useAdminDomainRefresh } from '@/lib/adminDomainEventsClient';

type ContractTab = 'new' | 'sealed' | 'inProgress' | 'completed';

const TABS: { id: ContractTab; label: string }[] = [
  { id: 'new', label: '신규' },
  { id: 'sealed', label: '계약체결' },
  { id: 'inProgress', label: '계약시작' },
  { id: 'completed', label: '계약종료' },
];

export default function AdminContractsPage() {
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<ContractTab>('sealed');
  const [searchQuery, setSearchQuery] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const rows = await getAllBookingsForAdmin();
    setBookings(rows);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useAdminDomainRefresh(['booking', 'payment'], () => {
    void load();
  });

  /** 예약 데이터만 바뀔 때가 아니라 시각 경과에도 탭 분류가 맞도록 주기 갱신 */
  const [nowTick, setNowTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setNowTick((t) => t + 1), 60_000);
    const onVis = () => {
      if (document.visibilityState === 'visible') setNowTick((t) => t + 1);
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  const now = useMemo(() => new Date(), [bookings, nowTick]);

  const sealedList = useMemo(
    () => bookings.filter((b) => isContractSealedTab(b, now)),
    [bookings, now]
  );
  const inProgressList = useMemo(
    () => bookings.filter((b) => isContractInProgressTab(b, now)),
    [bookings, now]
  );
  const completedList = useMemo(
    () => bookings.filter((b) => isContractCompletedTab(b, now)),
    [bookings, now]
  );
  const allContractList = useMemo(
    () => [...sealedList, ...inProgressList, ...completedList],
    [sealedList, inProgressList, completedList]
  );
  const newList = useMemo(() => {
    const nowMs = Date.now();
    return allContractList.filter((b) => {
      const t = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return Number.isFinite(t) && nowMs - t < ADMIN_NEW_MS;
    });
  }, [allContractList]);

  const activeList =
    tab === 'new'
      ? newList
      : tab === 'sealed'
        ? sealedList
        : tab === 'inProgress'
          ? inProgressList
          : completedList;

  const emailMap = useOwnerEmailMap(bookings);

  const filteredList = useMemo(
    () => filterBookingsBySearch(activeList, searchQuery, emailMap),
    [activeList, searchQuery, emailMap]
  );

  const emptyMsg =
    tab === 'new'
      ? '신규 계약 건이 없습니다.'
      : tab === 'sealed'
        ? '계약체결(결제·확정, 숙박 전) 예약이 없습니다.'
        : tab === 'inProgress'
          ? '계약시작(체크인~체크아웃 진행 중) 예약이 없습니다.'
          : '계약종료(체크아웃 이후·이용완료) 예약이 없습니다.';

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

  useEffect(() => {
    if (tab !== 'new') return;
    void (async () => {
      await acknowledgeCurrentNewContracts();
      refreshAdminBadges();
    })();
  }, [tab]);

  return (
    <AdminRouteGuard>
      <div>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-900">계약</h1>
            <p className="text-sm text-slate-500">
              체결 → 시작(숙박 중) → 종료(체크아웃 이후) · 체결 {sealedList.length} · 시작{' '}
              {inProgressList.length} · 종료 {completedList.length}
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
                (
                {t.id === 'new'
                  ? newList.length
                  : t.id === 'sealed'
                  ? sealedList.length
                  : t.id === 'inProgress'
                    ? inProgressList.length
                    : completedList.length}
                )
              </span>
            </button>
          ))}
        </div>

        <div className="mb-4">
          <label htmlFor="contract-search" className="sr-only">
            검색
          </label>
          <input
            id="contract-search"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="이메일, UID, 예약·매물명, 금액…"
            className="w-full max-w-md rounded-md border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400"
          />
          <p className="mt-1 text-xs text-slate-500">
            선택한 탭(신규·계약체결·계약시작·계약종료) 안에서만 검색됩니다.
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
                amountClassName="text-slate-900"
              />
            );
          })
        )}
      </div>
    </AdminRouteGuard>
  );
}
