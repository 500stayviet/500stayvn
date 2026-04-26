/**
 * 관리자 — 매물 상세
 *
 * 로직: `useAdminPropertyDetailPage` · UI: `AdminPropertyDetailPageView`.
 */

"use client";

import { useAdminPropertyDetailPage } from "./hooks/useAdminPropertyDetailPage";
import { AdminPropertyDetailPageView } from "./components/AdminPropertyDetailPageView";

export default function AdminPropertyDetailPage() {
  const vm = useAdminPropertyDetailPage();
  return <AdminPropertyDetailPageView vm={vm} />;
}
