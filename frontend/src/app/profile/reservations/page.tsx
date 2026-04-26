/**
 * 예약된 매물 관리 페이지
 *
 * 로직: `useReservationsPage` · UI: `ReservationsPageView` — 라우트는 Suspense + 조합만 담당한다.
 */

'use client';

import { Suspense } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getUIText } from '@/utils/i18n';
import { useReservationsPage } from './hooks/useReservationsPage';
import { ReservationsPageView } from './components/ReservationsPageView';

function ReservationsPageInner() {
  const vm = useReservationsPage();
  return <ReservationsPageView vm={vm} />;
}

export default function ReservationsPage() {
  const { currentLanguage } = useLanguage();
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-gray-500">{getUIText('loading', currentLanguage)}</div>
        </div>
      }
    >
      <ReservationsPageInner />
    </Suspense>
  );
}
