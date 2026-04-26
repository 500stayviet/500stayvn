/**
 * 관리자 — 감사 로그
 *
 * 로직: `useAdminAuditPage` · UI: `AdminAuditPageView` — Suspense + i18n 로딩.
 */

"use client";

import { Suspense } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { getUIText } from "@/utils/i18n";
import { useAdminAuditPage } from "./hooks/useAdminAuditPage";
import { AdminAuditPageView } from "./components/AdminAuditPageView";

function AdminAuditPageInner() {
  const vm = useAdminAuditPage();
  return <AdminAuditPageView vm={vm} />;
}

export default function AdminAuditPage() {
  const { currentLanguage } = useLanguage();
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
          <p className="text-sm text-slate-600">{getUIText("loading", currentLanguage)}</p>
        </div>
      }
    >
      <AdminAuditPageInner />
    </Suspense>
  );
}
