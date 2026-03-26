'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
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
    () => rows.filter((r) => {
      const st = normalizeStatus(r.status);
      return st === 'completed' || st === 'rejected';
    }),
    [rows]
  );

  return (
    <AdminRouteGuard>
      <div className="min-h-screen bg-gray-100 flex justify-center">
        <div className="w-full max-w-[430px] min-h-screen bg-white shadow-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-900">출금 요청 승인</h1>
            <Link href="/admin" className="text-sm text-blue-600">대시보드</Link>
          </div>
          <button
            onClick={load}
            className="w-full mb-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-sm font-medium"
          >
            {loading ? '불러오는 중...' : '새로고침'}
          </button>

          <h2 className="text-sm font-bold text-gray-700 mb-2">승인 대기</h2>
          <div className="space-y-3 mb-6">
            {pending.length === 0 ? (
              <p className="text-sm text-gray-500 py-4 text-center">출금 승인 대기가 없습니다.</p>
            ) : (
              pending.map((r) => (
                <div key={r.id} className="border border-gray-200 rounded-xl p-3">
                  <p className="font-semibold text-gray-900">{r.amount.toLocaleString()} ₫</p>
                  <p className="text-xs text-gray-500 mt-1">{r.ownerId}</p>
                  <p className="text-xs text-gray-600 mt-1">{r.bankLabel}</p>
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <button
                      onClick={() => {
                        if (!admin?.username) return;
                        approveWithdrawal(r.id, admin.username);
                        load();
                      }}
                      className="py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
                    >
                      승인
                    </button>
                    <button
                      onClick={() => {
                        if (!admin?.username) return;
                        rejectWithdrawal(r.id, admin.username, '관리자 반려');
                        load();
                      }}
                      className="py-2 rounded-lg bg-red-50 text-red-600 text-sm font-semibold hover:bg-red-100"
                    >
                      반려
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <h2 className="text-sm font-bold text-gray-700 mb-2">처리 중</h2>
          <div className="space-y-3 mb-6">
            {processing.length === 0 ? (
              <p className="text-sm text-gray-500 py-2 text-center">처리 중인 출금이 없습니다.</p>
            ) : (
              processing.map((r) => (
                <div key={r.id} className="border border-gray-200 rounded-xl p-3">
                  <p className="font-semibold text-gray-900">{r.amount.toLocaleString()} ₫</p>
                  <p className="text-xs text-gray-500 mt-1">{r.ownerId}</p>
                  <p className="text-xs text-gray-600 mt-1">{r.bankLabel}</p>
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    <button
                      onClick={() => {
                        if (!admin?.username) return;
                        holdWithdrawal(r.id, admin.username, '관리자 홀딩');
                        load();
                      }}
                      className="py-2 rounded-lg bg-yellow-50 text-yellow-700 text-sm font-semibold hover:bg-yellow-100"
                    >
                      홀딩
                    </button>
                    <button
                      onClick={() => {
                        if (!admin?.username) return;
                        completeWithdrawal(r.id, admin.username);
                        load();
                      }}
                      className="py-2 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700"
                    >
                      완료
                    </button>
                    <button
                      onClick={() => {
                        if (!admin?.username) return;
                        rejectWithdrawal(r.id, admin.username, '관리자 반려');
                        load();
                      }}
                      className="py-2 rounded-lg bg-red-50 text-red-600 text-sm font-semibold hover:bg-red-100"
                    >
                      반려
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <h2 className="text-sm font-bold text-gray-700 mb-2">보류</h2>
          <div className="space-y-3 mb-6">
            {held.length === 0 ? (
              <p className="text-sm text-gray-500 py-2 text-center">보류된 출금이 없습니다.</p>
            ) : (
              held.map((r) => (
                <div key={r.id} className="border border-gray-200 rounded-xl p-3">
                  <p className="font-semibold text-gray-900">{r.amount.toLocaleString()} ₫</p>
                  <p className="text-xs text-gray-500 mt-1">{r.ownerId}</p>
                  <p className="text-xs text-gray-600 mt-1">{r.bankLabel}</p>
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <button
                      onClick={() => {
                        if (!admin?.username) return;
                        resumeWithdrawal(r.id, admin.username);
                        load();
                      }}
                      className="py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
                    >
                      재개
                    </button>
                    <button
                      onClick={() => {
                        if (!admin?.username) return;
                        rejectWithdrawal(r.id, admin.username, '관리자 반려');
                        load();
                      }}
                      className="py-2 rounded-lg bg-red-50 text-red-600 text-sm font-semibold hover:bg-red-100"
                    >
                      반려
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <h2 className="text-sm font-bold text-gray-700 mb-2">완료 / 반려</h2>
          <div className="space-y-2">
            {done.length === 0 ? (
              <p className="text-sm text-gray-500 py-2 text-center">완료/반려 내역이 없습니다.</p>
            ) : (
              done.map((r) => {
                const st = normalizeStatus(r.status);
                return (
                  <div key={r.id} className="border border-gray-100 rounded-lg p-2.5">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-900">{r.amount.toLocaleString()} ₫</p>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          st === 'completed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {st === 'completed' ? '완료' : '반려'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{r.ownerId}</p>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </AdminRouteGuard>
  );
}

