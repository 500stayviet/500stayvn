/**
 * 관리자 — 시스템 로그
 *
 * 로직: `useAdminSystemLogPage` · UI: `AdminSystemLogPageView` — Suspense로 i18n 로딩.
 */

"use client";

import { Suspense } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { getUIText } from "@/utils/i18n";
import { useAdminSystemLogPage } from "./hooks/useAdminSystemLogPage";
import { AdminSystemLogPageView } from "./components/AdminSystemLogPageView";

function AdminSystemLogPageInner() {
  const vm = useAdminSystemLogPage();
  return <AdminSystemLogPageView vm={vm} />;
}

export default function AdminSystemLogPage() {
  const { currentLanguage } = useLanguage();
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
          <p className="text-sm text-slate-600">{getUIText("loading", currentLanguage)}</p>
        </div>
      }
    >
      <AdminSystemLogPageInner />
    </Suspense>
  );
}
