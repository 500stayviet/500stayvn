/**
 * Settlement & Wallet Page (정산 및 지갑 페이지)
 *
 * 로직은 `useSettlementPage`, UI는 `SettlementPageView` — 라우트 파일은 조합만 담당한다.
 */

'use client';

import { useSettlementPage } from './hooks/useSettlementPage';
import { SettlementPageView } from './components/SettlementPageView';

export default function SettlementPage() {
  const vm = useSettlementPage();
  return <SettlementPageView vm={vm} />;
}
