/**
 * 관리자 — 매물 목록
 *
 * 로직: `useAdminPropertiesPage` · UI: `AdminPropertiesPageView` — Suspense.
 */

"use client";

import { Suspense } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { getUIText } from "@/utils/i18n";
import { useAdminPropertiesPage } from "./hooks/useAdminPropertiesPage";
import { AdminPropertiesPageView } from "./components/AdminPropertiesPageView";

function AdminPropertiesPageInner() {
  const vm = useAdminPropertiesPage();
  return <AdminPropertiesPageView vm={vm} />;
}

export default function AdminPropertiesPage() {
  const { currentLanguage } = useLanguage();
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
          <p className="text-sm text-slate-600">{getUIText("loading", currentLanguage)}</p>
        </div>
      }
    >
      <AdminPropertiesPageInner />
    </Suspense>
  );
}
