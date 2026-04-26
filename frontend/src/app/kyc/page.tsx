/**
 * KYC (Know Your Customer) 인증 페이지
 *
 * 로직: `useKycPageState` · UI: `KycPageView`.
 */

"use client";

import { useKycPageState } from "./hooks/useKycPageState";
import { KycPageView } from "./components/KycPageView";

export default function KYCPage() {
  const vm = useKycPageState();
  return <KycPageView vm={vm} />;
}
