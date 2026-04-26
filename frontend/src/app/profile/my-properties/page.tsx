"use client";

import { Suspense } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { getUIText } from "@/utils/i18n";
import { MyPropertiesPageView } from "./components/MyPropertiesPageView";

/**
 * 내 매물 — 라우트는 Suspense + `MyPropertiesPageView` 조합만 담당한다.
 */
export default function MyPropertiesPage() {
  const { currentLanguage } = useLanguage();
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          {getUIText("loading", currentLanguage)}
        </div>
      }
    >
      <MyPropertiesPageView />
    </Suspense>
  );
}
