/**
 * 인터셉팅 라우트: 내 매물 관리 목록에서 카드 클릭 시 모달처럼 표시
 * 반드시 PropertyDetailView(편지지 스타일)만 사용.
 *
 * 로직: `useInterceptedMyPropertyDetailPage` · UI: `InterceptedMyPropertyDetailView`.
 */

"use client";

import { useInterceptedMyPropertyDetailPage } from "../[id]/hooks/useInterceptedMyPropertyDetailPage";
import { InterceptedMyPropertyDetailView } from "../[id]/components/InterceptedMyPropertyDetailView";

export default function InterceptedMyPropertyDetailPage() {
  const vm = useInterceptedMyPropertyDetailPage();
  return <InterceptedMyPropertyDetailView vm={vm} />;
}
