/**
 * Booking Page (예약 페이지)
 *
 * 로직: `useBookingPage` · UI: `BookingPageView` — 라우트는 Suspense + 조합만 담당한다.
 */

"use client";

import { Suspense } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { getUIText } from "@/utils/i18n";
import { useBookingPage } from "./hooks/useBookingPage";
import { BookingPageView } from "./components/BookingPageView";

function BookingPageInner() {
  const vm = useBookingPage();
  return <BookingPageView vm={vm} />;
}

export default function BookingPage() {
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
      <BookingPageInner />
    </Suspense>
  );
}
