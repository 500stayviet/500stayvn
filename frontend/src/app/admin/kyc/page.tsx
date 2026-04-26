/**
 * 관리자 KYC — PC 레이아웃(상단 AdminChrome), CSV 다운로드
 *
 * 로직: `useAdminKycPage` · UI: `AdminKycPageView`.
 */

"use client";

import { useAdminKycPage } from "./hooks/useAdminKycPage";
import { AdminKycPageView } from "./components/AdminKycPageView";

export default function AdminKYCPage() {
  const vm = useAdminKycPage();
  return <AdminKycPageView vm={vm} />;
}
