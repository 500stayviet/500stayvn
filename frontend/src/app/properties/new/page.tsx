/**
 * 새 매물 등록 (레거시 단일 폼)
 *
 * 로직: `useNewPropertyPage` · UI: `NewPropertyPageView`.
 */

"use client";

import { useNewPropertyPage } from "./hooks/useNewPropertyPage";
import { NewPropertyPageView } from "./components/NewPropertyPageView";

export default function NewPropertyPage() {
  const vm = useNewPropertyPage();
  return <NewPropertyPageView vm={vm} />;
}
