"use client";

import { Suspense } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { getUIText } from "@/utils/i18n";
import { Loader2 } from "lucide-react";
import MapPageContent from "@/components/map/MapPageContent";

// 2. 외부에 노출되는 페이지 컴포넌트 (Suspense 적용)
export default function MapPage() {
  const { currentLanguage } = useLanguage();
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
          <span className="ml-2">{getUIText('loading', currentLanguage)}</span>
        </div>
      }
    >
      <MapPageContent />
    </Suspense>
  );
}
