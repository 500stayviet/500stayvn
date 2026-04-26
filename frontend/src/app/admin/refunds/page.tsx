/**
 * 관리자 — 환불 승인
 *
 * 로직: `useAdminRefundsPage` · UI: `AdminRefundsPageView` — Suspense + i18n 로딩.
 */

"use client";

import { Suspense } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { getUIText } from "@/utils/i18n";
import { useAdminRefundsPage } from "./hooks/useAdminRefundsPage";
import { AdminRefundsPageView } from "./components/AdminRefundsPageView";

function AdminRefundsPageInner() {
  const vm = useAdminRefundsPage();
  return <AdminRefundsPageView vm={vm} />;
}

export default function AdminRefundsPage() {
  const { currentLanguage } = useLanguage();
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
          <p className="text-sm text-slate-600">{getUIText("loading", currentLanguage)}</p>
        </div>
      }
    >
      <AdminRefundsPageInner />
    </Suspense>
  );
}
