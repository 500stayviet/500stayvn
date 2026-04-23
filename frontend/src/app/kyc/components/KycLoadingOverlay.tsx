"use client";

import type { SupportedLanguage } from "@/lib/api/translation";

interface KycLoadingOverlayProps {
  currentLanguage: SupportedLanguage;
}

export default function KycLoadingOverlay({ currentLanguage }: KycLoadingOverlayProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 flex flex-col items-center gap-4">
        <div className="animate-spin h-8 w-8 text-blue-600 border-4 border-t-transparent rounded-full" />
        <p className="text-sm text-gray-700">
          {currentLanguage === "ko" ? "처리 중..." : "Đang xử lý..."}
        </p>
      </div>
    </div>
  );
}
