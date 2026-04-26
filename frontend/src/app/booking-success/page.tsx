/**
 * Booking Success Page (예약 완료 페이지)
 *
 * 로직: `useBookingSuccessPageData` + `useBookingSuccessPageActions` → `useBookingSuccessPage`.
 * UI: `BookingSuccessPageView` — Suspense + 조합만.
 */

"use client";

import { Suspense } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { getUIText } from "@/utils/i18n";
import { useBookingSuccessPage } from "./hooks/useBookingSuccessPage";
import { BookingSuccessPageView } from "./components/BookingSuccessPageView";

function BookingSuccessPageInner() {
  const vm = useBookingSuccessPage();
  return <BookingSuccessPageView vm={vm} />;
}

export default function BookingSuccessPage() {
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
      <BookingSuccessPageInner />
    </Suspense>
  );
}
