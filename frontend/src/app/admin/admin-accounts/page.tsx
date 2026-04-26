/**
 * 관리자 계정
 *
 * 로직: `useAdminAccountsPage` · UI: `AdminAccountsPageView`.
 */

"use client";

import { useAdminAccountsPage } from "./hooks/useAdminAccountsPage";
import { AdminAccountsPageView } from "./components/AdminAccountsPageView";

export default function AdminAccountsPage() {
  const vm = useAdminAccountsPage();
  return <AdminAccountsPageView vm={vm} />;
}
