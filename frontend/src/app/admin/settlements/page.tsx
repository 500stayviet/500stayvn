/**
 * 관리자 — 정산 승인
 *
 * 로직: `useAdminSettlementsPage` · UI: `AdminSettlementsPageView`.
 */

"use client";

import { Suspense } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { getUIText } from "@/utils/i18n";
import { useAdminSettlementsPage } from "./hooks/useAdminSettlementsPage";
import { AdminSettlementsPageView } from "./components/AdminSettlementsPageView";

function AdminSettlementsPageInner() {
  const vm = useAdminSettlementsPage();
  return <AdminSettlementsPageView vm={vm} />;
}

export default function AdminSettlementsPage() {
  const { currentLanguage } = useLanguage();
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="text-sm text-slate-600">{getUIText("loading", currentLanguage)}</div>
        </div>
      }
    >
      <AdminSettlementsPageInner />
    </Suspense>
  );
}
