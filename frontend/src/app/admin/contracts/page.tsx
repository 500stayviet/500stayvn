/**
 * 관리자 — 계약(단계별 예약 뷰)
 *
 * 로직: `useAdminContractsPage` · UI: `AdminContractsPageView` — Suspense + i18n 로딩.
 */

"use client";

import { Suspense } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { getUIText } from "@/utils/i18n";
import { useAdminContractsPage } from "./hooks/useAdminContractsPage";
import { AdminContractsPageView } from "./components/AdminContractsPageView";

function AdminContractsPageInner() {
  const vm = useAdminContractsPage();
  return <AdminContractsPageView vm={vm} />;
}

export default function AdminContractsPage() {
  const { currentLanguage } = useLanguage();
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
          <p className="text-sm text-slate-600">{getUIText("loading", currentLanguage)}</p>
        </div>
      }
    >
      <AdminContractsPageInner />
    </Suspense>
  );
}
