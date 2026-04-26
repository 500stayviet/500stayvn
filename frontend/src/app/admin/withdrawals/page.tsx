/**
 * 관리자 — 출금 요청
 *
 * 로직: `useAdminWithdrawalsPage` · UI: `AdminWithdrawalsPageView` — `useSearchParams`용 Suspense.
 */

"use client";

import { Suspense } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { getUIText } from "@/utils/i18n";
import { useAdminWithdrawalsPage } from "./hooks/useAdminWithdrawalsPage";
import { AdminWithdrawalsPageView } from "./components/AdminWithdrawalsPageView";

function AdminWithdrawalsPageInner() {
  const vm = useAdminWithdrawalsPage();
  return <AdminWithdrawalsPageView vm={vm} />;
}

export default function AdminWithdrawalsPage() {
  const { currentLanguage } = useLanguage();
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
          <p className="text-sm text-slate-600">{getUIText("loading", currentLanguage)}</p>
        </div>
      }
    >
      <AdminWithdrawalsPageInner />
    </Suspense>
  );
}
