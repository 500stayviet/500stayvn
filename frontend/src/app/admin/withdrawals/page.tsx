'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import AdminRouteGuard from '@/components/admin/AdminRouteGuard';
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

export default function AdminWithdrawalsPage() {
  const [rows, setRows] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const admin = getAdminSession();

  const load = () => {
    setLoading(true);
    setRows(getWithdrawalRequests());
    setLoading(false);
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
  const done = useMemo(
    () =>
      rows.filter((r) => {
        const st = normalizeStatus(r.status);
        return st === 'completed' || st === 'rejected';
      }),
    [rows]
  );

  const column = (title: string, empty: string, list: WithdrawalRequest[], body: ReactNode) => (
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

  return (
    <AdminRouteGuard>
      <div>
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-900">출금 요청 승인</h1>
            <p className="text-sm text-slate-500">단계별로 처리하세요.</p>
          </div>
          <button
            type="button"
            onClick={load}
            className="shrink-0 rounded-md bg-slate-100 px-4 py-2 text-sm font-medium hover:bg-slate-200"
          >
            {loading ? '불러오는 중...' : '새로고침'}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-4 2xl:items-start">
          {column(
            '승인 대기',
            '대기 건이 없습니다.',
            pending,
            pending.map((r) => (
              <div key={r.id} className="rounded-md border border-slate-200 bg-white p-3 text-sm shadow-sm">
                <p className="font-bold text-slate-900">{r.amount.toLocaleString()} ₫</p>
                <p className="mt-0.5 font-mono text-[11px] text-slate-500">{r.ownerId}</p>
                <p className="text-xs text-slate-600">{r.bankLabel}</p>
                <div className="mt-2 grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      if (!admin?.username) return;
                      approveWithdrawal(r.id, admin.username);
                      load();
                    }}
                    className="rounded-md bg-blue-600 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                  >
                    승인
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!admin?.username) return;
                      rejectWithdrawal(r.id, admin.username, '관리자 반려');
                      load();
                    }}
                    className="rounded-md bg-red-50 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
                  >
                    반려
                  </button>
                </div>
              </div>
            ))
          )}

          {column(
            '처리 중',
            '처리 중인 출금이 없습니다.',
            processing,
            processing.map((r) => (
              <div key={r.id} className="rounded-md border border-slate-200 bg-white p-3 text-sm shadow-sm">
                <p className="font-bold text-slate-900">{r.amount.toLocaleString()} ₫</p>
                <p className="mt-0.5 font-mono text-[11px] text-slate-500">{r.ownerId}</p>
                <p className="text-xs text-slate-600">{r.bankLabel}</p>
                <div className="mt-2 grid grid-cols-3 gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (!admin?.username) return;
                      holdWithdrawal(r.id, admin.username, '관리자 홀딩');
                      load();
                    }}
                    className="rounded-md bg-amber-50 py-1.5 text-[10px] font-semibold text-amber-900 hover:bg-amber-100"
                  >
                    홀딩
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!admin?.username) return;
                      completeWithdrawal(r.id, admin.username);
                      load();
                    }}
                    className="rounded-md bg-green-600 py-1.5 text-[10px] font-semibold text-white hover:bg-green-700"
                  >
                    완료
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!admin?.username) return;
                      rejectWithdrawal(r.id, admin.username, '관리자 반려');
                      load();
                    }}
                    className="rounded-md bg-red-50 py-1.5 text-[10px] font-semibold text-red-700 hover:bg-red-100"
                  >
                    반려
                  </button>
                </div>
              </div>
            ))
          )}

          {column(
            '보류',
            '보류 건이 없습니다.',
            held,
            held.map((r) => (
              <div key={r.id} className="rounded-md border border-slate-200 bg-white p-3 text-sm shadow-sm">
                <p className="font-bold text-slate-900">{r.amount.toLocaleString()} ₫</p>
                <p className="mt-0.5 font-mono text-[11px] text-slate-500">{r.ownerId}</p>
                <p className="text-xs text-slate-600">{r.bankLabel}</p>
                <div className="mt-2 grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      if (!admin?.username) return;
                      resumeWithdrawal(r.id, admin.username);
                      load();
                    }}
                    className="rounded-md bg-blue-600 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                  >
                    재개
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!admin?.username) return;
                      rejectWithdrawal(r.id, admin.username, '관리자 반려');
                      load();
                    }}
                    className="rounded-md bg-red-50 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
                  >
                    반려
                  </button>
                </div>
              </div>
            ))
          )}

          {column(
            '완료·반려',
            '내역이 없습니다.',
            done,
            done.map((r) => {
              const st = normalizeStatus(r.status);
              return (
                <div key={r.id} className="rounded-md border border-slate-100 bg-white p-2.5 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-slate-900">{r.amount.toLocaleString()} ₫</p>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        st === 'completed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {st === 'completed' ? '완료' : '반려'}
                    </span>
                  </div>
                  <p className="mt-0.5 font-mono text-[11px] text-slate-500">{r.ownerId}</p>
                </div>
              );
            })
          )}
        </div>
      </div>
    </AdminRouteGuard>
  );
}
