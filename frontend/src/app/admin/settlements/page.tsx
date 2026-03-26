'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
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

  return (
    <AdminRouteGuard>
      <div className="min-h-screen bg-gray-100 flex justify-center">
        <div className="w-full max-w-[430px] min-h-screen bg-white shadow-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-900">정산 승인</h1>
            <Link href="/admin" className="text-sm text-blue-600">대시보드</Link>
          </div>

          <p className="text-xs text-gray-500 mb-4">
            체크아웃+24시간 조건을 통과한 건을 관리자가 승인하면 출금 가능 금액으로 반영됩니다.
          </p>

          <button
            onClick={load}
            className="w-full mb-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-sm font-medium"
          >
            {loading ? '불러오는 중...' : '새로고침'}
          </button>

          <div className="space-y-6">
            <div>
              <h2 className="text-sm font-bold text-gray-700 mb-2">승인 대기</h2>
              <div className="space-y-3">
                {needApproval.length === 0 ? (
                  <p className="text-sm text-gray-500 py-4 text-center">승인 대기 정산 건이 없습니다.</p>
                ) : (
                  needApproval.map((row) => (
                    <div key={row.bookingId} className="border border-gray-200 rounded-xl p-3">
                      <p className="font-semibold text-gray-900">{row.propertyTitle || 'Untitled'}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {row.checkInDate} ~ {row.checkOutDate}
                      </p>
                      <p className="text-sm text-gray-800 mt-1">Owner: {row.ownerId}</p>
                      <p className="text-lg font-bold text-emerald-600 mt-2">
                        {row.amount.toLocaleString()} ₫
                      </p>
                      <button
                        onClick={() => {
                          if (!admin?.username) return;
                          const ok = approveSettlement(row, admin.username);
                          if (!ok) return;
                          load();
                        }}
                        className="mt-3 w-full py-2.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        승인 후 출금가능 반영
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div>
              <h2 className="text-sm font-bold text-gray-700 mb-2">승인 완료(활성)</h2>
              <div className="space-y-3">
                {approvedActive.length === 0 ? (
                  <p className="text-sm text-gray-500 py-4 text-center">홀딩되지 않은 승인 완료 건이 없습니다.</p>
                ) : (
                  approvedActive.map((row) => (
                    <div key={row.bookingId} className="border border-gray-200 rounded-xl p-3">
                      <p className="font-semibold text-gray-900">{row.propertyTitle || 'Untitled'}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {row.checkInDate} ~ {row.checkOutDate}
                      </p>
                      <p className="text-sm text-gray-800 mt-1">Owner: {row.ownerId}</p>
                      <p className="text-lg font-bold text-emerald-600 mt-2">
                        {row.amount.toLocaleString()} ₫
                      </p>
                      <button
                        onClick={() => {
                          if (!admin?.username) return;
                          holdSettlement(row.bookingId, admin.username, '관리자 홀딩');
                          load();
                        }}
                        className="mt-3 w-full py-2.5 rounded-lg bg-yellow-50 text-yellow-700 font-semibold hover:bg-yellow-100 flex items-center justify-center"
                      >
                        홀딩 (출금가능 반영 중단)
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div>
              <h2 className="text-sm font-bold text-gray-700 mb-2">보류(홀딩)</h2>
              <div className="space-y-3">
                {heldRows.length === 0 ? (
                  <p className="text-sm text-gray-500 py-4 text-center">보류 중인 정산 건이 없습니다.</p>
                ) : (
                  heldRows.map((row) => (
                    <div key={row.bookingId} className="border border-gray-200 rounded-xl p-3">
                      <p className="font-semibold text-gray-900">{row.propertyTitle || 'Untitled'}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {row.checkInDate} ~ {row.checkOutDate}
                      </p>
                      <p className="text-sm text-gray-800 mt-1">Owner: {row.ownerId}</p>
                      <p className="text-lg font-bold text-amber-600 mt-2">
                        {row.amount.toLocaleString()} ₫
                      </p>
                      <button
                        onClick={() => {
                          if (!admin?.username) return;
                          resumeSettlement(row.bookingId, admin.username);
                          load();
                        }}
                        className="mt-3 w-full py-2.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 flex items-center justify-center"
                      >
                        재개 (출금가능 반영 복구)
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminRouteGuard>
  );
}

