"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { getUIText } from "@/utils/i18n";

/** 검색 `useSearchParams` 등으로 인한 Suspense 폴백 — 언어 컨텍스트에 맞는 로딩 문구 */
export function SearchPageSuspenseFallback() {
  const { currentLanguage } = useLanguage();
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-gray-500">{getUIText("loading", currentLanguage)}</div>
    </div>
  );
}
