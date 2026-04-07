'use client';

import { useRouter } from 'next/navigation';
import AdminRouteGuard from '@/components/admin/AdminRouteGuard';
import { useAdminMe } from '@/contexts/AdminMeContext';
import { logoutAdmin } from '@/lib/api/adminAuth';

export default function AdminNoAccessPage() {
  const { me } = useAdminMe();
  const router = useRouter();

  const onLogout = async () => {
    await logoutAdmin();
    router.replace('/admin/login');
  };

  return (
    <AdminRouteGuard>
      <div className="mx-auto max-w-lg text-center">
        <h1 className="text-lg font-bold text-slate-900">접근 가능한 메뉴가 없습니다</h1>
        <p className="mt-2 text-sm text-slate-600">
          {me?.username ? (
            <>
              계정 <span className="font-medium">{me.username}</span> 에 부여된 권한이 없습니다. 슈퍼
              관리자에게 메뉴 권한을 요청하세요.
            </>
          ) : (
            '슈퍼 관리자에게 메뉴 권한을 요청하세요.'
          )}
        </p>
        <button
          type="button"
          onClick={() => void onLogout()}
          className="mt-6 text-sm font-medium text-slate-700 underline underline-offset-2 hover:text-slate-900"
        >
          로그아웃 후 다른 계정으로 로그인
        </button>
      </div>
    </AdminRouteGuard>
  );
}
