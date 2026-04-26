/**
 * 매물 상세 페이지 - /properties/[id]
 * 직접 접근 시 전체 페이지로 PropertyDetailView 표시
 */

'use client';

import { usePropertyDetailPage } from './hooks/usePropertyDetailPage';
import { PropertyDetailRouteView } from './components/PropertyDetailRouteView';

export default function PropertyDetailPage() {
  const vm = usePropertyDetailPage();
  return <PropertyDetailRouteView vm={vm} />;
}
