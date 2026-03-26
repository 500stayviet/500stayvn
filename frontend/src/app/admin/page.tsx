'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldCheck, LogOut, Wallet, ArrowUpRight, ClipboardList, Users, Home } from 'lucide-react';
import AdminRouteGuard from '@/components/admin/AdminRouteGuard';
import { logoutAdmin } from '@/lib/api/adminAuth';

export default function AdminPage() {
  const router = useRouter();

  return (
    <AdminRouteGuard>
      <div className="min-h-screen bg-gray-100 flex justify-center">
        <div className="w-full max-w-[430px] min-h-screen bg-white shadow-xl p-5">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-blue-700" />
              <h1 className="text-xl font-bold text-gray-900">관리자 대시보드</h1>
            </div>
            <button
              onClick={() => {
                logoutAdmin();
                router.replace('/admin/login');
              }}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200"
              title="로그아웃"
            >
              <LogOut className="w-4 h-4 text-gray-700" />
            </button>
          </div>

          <div className="space-y-3">
            <Link href="/admin/settlements" className="block">
              <div className="rounded-xl border border-gray-200 p-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <Wallet className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="font-semibold text-gray-900">정산 승인</p>
                    <p className="text-xs text-gray-500">출금 가능 금액 반영 승인</p>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-gray-400" />
              </div>
            </Link>

            <Link href="/admin/withdrawals" className="block">
              <div className="rounded-xl border border-gray-200 p-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <ClipboardList className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-semibold text-gray-900">출금 요청 승인</p>
                    <p className="text-xs text-gray-500">사용자 출금 요청 처리</p>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-gray-400" />
              </div>
            </Link>

            <Link href="/admin/audit" className="block">
              <div className="rounded-xl border border-gray-200 p-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-emerald-600" />
                  <div>
                    <p className="font-semibold text-gray-900">감사 로그</p>
                    <p className="text-xs text-gray-500">금전 이동 이력 조회</p>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-gray-400" />
              </div>
            </Link>

            <Link href="/admin/users" className="block">
              <div className="rounded-xl border border-gray-200 p-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-indigo-600" />
                  <div>
                    <p className="font-semibold text-gray-900">계정 관리</p>
                    <p className="text-xs text-gray-500">차단/복구 및 검색</p>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-gray-400" />
              </div>
            </Link>

            <Link href="/admin/properties" className="block">
              <div className="rounded-xl border border-gray-200 p-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <Home className="w-5 h-5 text-rose-600" />
                  <div>
                    <p className="font-semibold text-gray-900">매물 관리</p>
                    <p className="text-xs text-gray-500">숨김/복구 및 검색</p>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-gray-400" />
              </div>
            </Link>

            <Link href="/admin/kyc" className="block">
              <div className="rounded-xl border border-gray-200 p-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-orange-600" />
                  <div>
                    <p className="font-semibold text-gray-900">KYC 데이터</p>
                    <p className="text-xs text-gray-500">기존 관리자 KYC 페이지</p>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-gray-400" />
              </div>
            </Link>
          </div>
        </div>
      </div>
    </AdminRouteGuard>
  );
}
