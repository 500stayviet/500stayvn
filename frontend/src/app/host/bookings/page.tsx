/**
 * Host Bookings Page (예약 관리 페이지 - 임대인용)
 *
 * 로직: `useHostBookingsPage` · UI: `HostBookingsPageView` — 라우트는 Suspense + 조합만 담당한다.
 */

"use client";

import { Suspense } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { getUIText } from "@/utils/i18n";
import { useHostBookingsPage } from "./hooks/useHostBookingsPage";
import { HostBookingsPageView } from "./components/HostBookingsPageView";

function HostBookingsPageInner() {
  const vm = useHostBookingsPage();
  return <HostBookingsPageView vm={vm} />;
}

export default function HostBookingsPage() {
  const { currentLanguage } = useLanguage();
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-gray-500">
            {getUIText("loading", currentLanguage)}
          </div>
        </div>
      }
    >
      <HostBookingsPageInner />
    </Suspense>
  );
}
