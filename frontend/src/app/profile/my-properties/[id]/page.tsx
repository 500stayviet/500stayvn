/**
 * 매물 상세 페이지 (직접 URL 접근 시)
 * - my-properties 목록에서 카드 클릭 시에는 모달로 상세 표시
 * - /profile/my-properties/[id] 직접 접근 시 이 페이지 사용
 *
 * 로직: `useMyPropertyDetailRoutePage` · UI: `MyPropertyDetailRouteView`.
 */

"use client";

import { useMyPropertyDetailRoutePage } from "./hooks/useMyPropertyDetailRoutePage";
import { MyPropertyDetailRouteView } from "./components/MyPropertyDetailRouteView";

export default function PropertyDetailPage() {
  const vm = useMyPropertyDetailRoutePage();
  return <MyPropertyDetailRouteView vm={vm} />;
}
