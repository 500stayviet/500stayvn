'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import AdminRouteGuard from '@/components/admin/AdminRouteGuard';
import { refreshAdminBadges } from '@/lib/adminBadgeCounts';
import { getAdminSession } from '@/lib/api/adminAuth';
import {
  approveWithdrawal,
  completeWithdrawal,
  getWithdrawalRequests,
  holdWithdrawal,
  rejectWithdrawal,
  resumeWithdrawal,
  WithdrawalRequest,
} from '@/lib/api/adminFinance';
import { filterWithdrawalsBySearch, getOwnerEmailMap } from '@/lib/adminSearchHelpers';

type WithdrawalTab = 'pending' | 'processing' | 'completed' | 'rejected' | 'held';

const TABS: { id: WithdrawalTab; label: string }[] = [
  { id: 'pending', label: '승인 대기' },
  { id: 'processing', label: '처리 중' },
  { id: 'rejected', label: '반려' },
  { id: 'completed', label: '완료' },
  { id: 'held', label: '보류' },
];

export default function AdminWithdrawalsPage() {
  const [rows, setRows] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<WithdrawalTab>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const admin = getAdminSession();

  const load = () => {
    setLoading(true);
    setRows(getWithdrawalRequests());
    setLoading(false);
    refreshAdminBadges();
  };

  useEffect(() => {
    load();
  }, []);

  const normalizeStatus = (s: WithdrawalRequest['status']) => (s === 'approved' ? 'processing' : s);

  const pending = useMemo(() => rows.filter((r) => normalizeStatus(r.status) === 'pending'), [rows]);
  const processing = useMemo(
    () => rows.filter((r) => normalizeStatus(r.status) === 'processing'),
    [rows]
  );
  const held = useMemo(() => rows.filter((r) => normalizeStatus(r.status) === 'held'), [rows]);
  const completed = useMemo(
    () => rows.filter((r) => normalizeStatus(r.status) === 'completed'),
    [rows]
  );
  const rejected = useMemo(
    () => rows.filter((r) => normalizeStatus(r.status) === 'rejected'),
    [rows]
  );

  const activeList = useMemo(() => {
    if (tab === 'pending') return pending;
    if (tab === 'processing') return processing;
    if (tab === 'rejected') return rejected;
    if (tab === 'completed') return completed;
    return held;
  }, [tab, pending, processing, rejected, completed, held]);

  const emailMap = useMemo(() => getOwnerEmailMap(), [rows]);

  const filteredList = useMemo(
    () => filterWithdrawalsBySearch(activeList, searchQuery, emailMap),
    [activeList, searchQuery, emailMap]
  );

  const emptyMsg =
    tab === 'pending'
      ? '승인 대기 건이 없습니다.'
      : tab === 'processing'
        ? '처리 중인 출금이 없습니다.'
        : tab === 'completed'
          ? '완료된 출금 내역이 없습니다.'
          : tab === 'rejected'
            ? '반려된 출금 내역이 없습니다.'
            : '보류된 출금이 없습니다.';

  const column = (list: WithdrawalRequest[], body: ReactNode) => (
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

  const run = (fn: () => void) => {
    fn();
    load();
  };

  const ownerBlock = (r: WithdrawalRequest) => {
    const email = emailMap.get(r.ownerId) || '—';
    return (
      <>
        <p className="font-mono text-[11px] text-slate-800 break-all">UID: {r.ownerId}</p>
        <p className="text-xs text-slate-700 break-all">{email}</p>
      </>
    );
  };

  return (
    <AdminRouteGuard>
      <div>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-900">출금 요청 승인</h1>
            <p className="text-sm text-slate-500">
              카테고리별로 확인하세요. · 대기 {pending.length} · 처리 {processing.length} · 반려{' '}
              {rejected.length} · 완료 {completed.length} · 보류 {held.length}
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
                  ? pending.length
                  : t.id === 'processing'
                    ? processing.length
                    : t.id === 'rejected'
                      ? rejected.length
                      : t.id === 'completed'
                        ? completed.length
                        : held.length}
                )
              </span>
            </button>
          ))}
        </div>

        <div className="mb-4">
          <label htmlFor="withdrawal-search" className="sr-only">
            검색
          </label>
          <input
            id="withdrawal-search"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="이메일, UID, 계좌 라벨, 금액…"
            className="w-full max-w-md rounded-md border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400"
          />
          <p className="mt-1 text-xs text-slate-500">
            선택한 탭(승인 대기·처리 중·반려·완료·보류) 안에서만 검색됩니다.
          </p>
        </div>

        {column(
          filteredList,
          filteredList.map((r) => {
            if (tab === 'pending') {
              return (
                <div key={r.id} className="rounded-md border border-slate-200 bg-white p-3 text-sm shadow-sm">
                  {ownerBlock(r)}
                  <p className="mt-1 font-bold text-slate-900">{r.amount.toLocaleString()} ₫</p>
                  <p className="text-xs text-slate-600">{r.bankLabel}</p>
                  <div className="mt-2 grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        if (!admin?.username) return;
                        run(() => approveWithdrawal(r.id, admin.username));
                      }}
                      className="rounded-md bg-blue-600 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                    >
                      승인
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!admin?.username) return;
                        run(() => rejectWithdrawal(r.id, admin.username, '관리자 반려'));
                      }}
                      className="rounded-md bg-red-50 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
                    >
                      반려
                    </button>
                  </div>
                </div>
              );
            }
            if (tab === 'processing') {
              return (
                <div key={r.id} className="rounded-md border border-slate-200 bg-white p-3 text-sm shadow-sm">
                  {ownerBlock(r)}
                  <p className="mt-1 font-bold text-slate-900">{r.amount.toLocaleString()} ₫</p>
                  <p className="text-xs text-slate-600">{r.bankLabel}</p>
                  <div className="mt-2 grid grid-cols-3 gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        if (!admin?.username) return;
                        run(() => holdWithdrawal(r.id, admin.username, '관리자 홀딩'));
                      }}
                      className="rounded-md bg-amber-50 py-1.5 text-[10px] font-semibold text-amber-900 hover:bg-amber-100"
                    >
                      홀딩
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!admin?.username) return;
                        run(() => completeWithdrawal(r.id, admin.username));
                      }}
                      className="rounded-md bg-green-600 py-1.5 text-[10px] font-semibold text-white hover:bg-green-700"
                    >
                      완료
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!admin?.username) return;
                        run(() => rejectWithdrawal(r.id, admin.username, '관리자 반려'));
                      }}
                      className="rounded-md bg-red-50 py-1.5 text-[10px] font-semibold text-red-700 hover:bg-red-100"
                    >
                      반려
                    </button>
                  </div>
                </div>
              );
            }
            if (tab === 'held') {
              return (
                <div key={r.id} className="rounded-md border border-slate-200 bg-white p-3 text-sm shadow-sm">
                  {ownerBlock(r)}
                  <p className="mt-1 font-bold text-slate-900">{r.amount.toLocaleString()} ₫</p>
                  <p className="text-xs text-slate-600">{r.bankLabel}</p>
                  <div className="mt-2 grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        if (!admin?.username) return;
                        run(() => resumeWithdrawal(r.id, admin.username));
                      }}
                      className="rounded-md bg-blue-600 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                    >
                      재개
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!admin?.username) return;
                        run(() => rejectWithdrawal(r.id, admin.username, '관리자 반려'));
                      }}
                      className="rounded-md bg-red-50 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
                    >
                      반려
                    </button>
                  </div>
                </div>
              );
            }
            if (tab === 'completed' || tab === 'rejected') {
              const st = normalizeStatus(r.status);
              return (
                <div key={r.id} className="rounded-md border border-slate-100 bg-white p-2.5 text-sm">
                  {ownerBlock(r)}
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <p className="font-semibold text-slate-900">{r.amount.toLocaleString()} ₫</p>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        st === 'completed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {st === 'completed' ? '완료' : '반려'}
                    </span>
                  </div>
                </div>
              );
            }
            return null;
          })
        )}
      </div>
    </AdminRouteGuard>
  );
}
