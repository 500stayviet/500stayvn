"use client";

import type { SupportedLanguage } from "@/lib/api/translation";

interface KycPageHeaderProps {
  currentLanguage: SupportedLanguage;
}

export default function KycPageHeader({ currentLanguage }: KycPageHeaderProps) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">
        {currentLanguage === "ko" ? "임대인 인증" : "Host Verification"}
      </h1>
      <p className="text-sm text-gray-600">
        {currentLanguage === "ko" ? "3단계 인증을 완료해주세요" : "Please complete the 3-step verification"}
      </p>
    </div>
  );
}
