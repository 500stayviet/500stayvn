"use client";

import type { SupportedLanguage } from "@/lib/api/translation";
import { getUIText } from "@/utils/i18n";

interface KycPageHeaderProps {
  currentLanguage: SupportedLanguage;
}

export default function KycPageHeader({ currentLanguage }: KycPageHeaderProps) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">
        {getUIText("kycHostVerificationTitle", currentLanguage)}
      </h1>
      <p className="text-sm text-gray-600">
        {getUIText("kycCompleteThreeStepSubtitle", currentLanguage)}
      </p>
    </div>
  );
}
