/**
 * 관리자 — 매물 삭제/취소 로그
 *
 * 로직: `useAdminPropertyLogsPage` · UI: `AdminPropertyLogsPageView` — Suspense + i18n 로딩.
 */

"use client";

import { Suspense } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { getUIText } from "@/utils/i18n";
import { useAdminPropertyLogsPage } from "./hooks/useAdminPropertyLogsPage";
import { AdminPropertyLogsPageView } from "./components/AdminPropertyLogsPageView";

function AdminPropertyLogsPageInner() {
  const vm = useAdminPropertyLogsPage();
  return <AdminPropertyLogsPageView vm={vm} />;
}

export default function AdminPropertyLogsPage() {
  const { currentLanguage } = useLanguage();
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
          <p className="text-sm text-slate-600">{getUIText("loading", currentLanguage)}</p>
        </div>
      }
    >
      <AdminPropertyLogsPageInner />
    </Suspense>
  );
}
