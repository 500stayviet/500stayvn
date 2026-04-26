/**
 * My Bookings Page (내 예약 내역)
 *
 * 로직: `useMyBookingsPage` · UI: `MyBookingsPageView` — 라우트는 Suspense + 조합만 담당한다.
 */

"use client";

import { Suspense } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { getUIText } from "@/utils/i18n";
import { useMyBookingsPage } from "./hooks/useMyBookingsPage";
import { MyBookingsPageView } from "./components/MyBookingsPageView";

function MyBookingsPageInner() {
  const vm = useMyBookingsPage();
  return <MyBookingsPageView vm={vm} />;
}

export default function MyBookingsPage() {
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
      <MyBookingsPageInner />
    </Suspense>
  );
}
