import AdminLayoutClient from '@/components/admin/AdminLayoutClient';

/** 관리자: 쿠키 세션 + DB 권한 — 정적 프리렌더 시 청크 오류 방지 */
export const dynamic = 'force-dynamic';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
