/**
 * 관리자 — 계정 목록
 *
 * 로직: `useAdminUsersPage` · UI: `AdminUsersPageView` — Suspense로 i18n 로딩과 조합.
 */

"use client";

import { Suspense } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { getUIText } from "@/utils/i18n";
import { useAdminUsersPage } from "./hooks/useAdminUsersPage";
import { AdminUsersPageView } from "./components/AdminUsersPageView";

function AdminUsersPageInner() {
  const vm = useAdminUsersPage();
  return <AdminUsersPageView vm={vm} />;
}

export default function AdminUsersPage() {
  const { currentLanguage } = useLanguage();
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
          <p className="text-sm text-slate-600">{getUIText("loading", currentLanguage)}</p>
        </div>
      }
    >
      <AdminUsersPageInner />
    </Suspense>
  );
}
