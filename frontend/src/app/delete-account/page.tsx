"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { getUIText } from "@/utils/i18n";

const DELETE_ACCOUNT_EMAIL = "bek94909490@gmail.com";

export default function DeleteAccountPage() {
  const { currentLanguage } = useLanguage();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-md p-8 max-w-md text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          {getUIText("deleteAccountTitle", currentLanguage)}
        </h1>
        <div className="text-gray-600 mb-6">
          <p className="mb-4">
            {getUIText("deleteAccountIntro", currentLanguage)}
          </p>
          <p className="text-lg font-semibold text-blue-600">
            {DELETE_ACCOUNT_EMAIL}
          </p>
        </div>
        <div className="border-t border-gray-200 pt-6">
          <p className="text-sm text-gray-500">
            {getUIText("deleteAccountFooterNote", currentLanguage)}
          </p>
        </div>
      </div>
    </div>
  );
}
