/**
 * 관리자 — 회원(uid) 상세
 *
 * 로직: `useAdminUserDetailPage` · UI: `AdminUserDetailPageView`.
 */

"use client";

import { useAdminUserDetailPage } from "./hooks/useAdminUserDetailPage";
import { AdminUserDetailPageView } from "./components/AdminUserDetailPageView";

export default function AdminUserDetailPage() {
  const vm = useAdminUserDetailPage();
  return <AdminUserDetailPageView vm={vm} />;
}
