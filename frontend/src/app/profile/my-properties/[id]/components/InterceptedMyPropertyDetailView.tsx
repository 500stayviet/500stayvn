"use client";

import PropertyDetailView from "@/components/PropertyDetailView";
import AppBox from "@/components/AppBox";
import type { SupportedLanguage } from "@/lib/api/translation";
import { getUIText } from "@/utils/i18n";
import type { InterceptedMyPropertyDetailPageViewModel } from "../hooks/useInterceptedMyPropertyDetailPage";

type Props = { vm: InterceptedMyPropertyDetailPageViewModel };

/**
 * 인터셉팅 라우트 UI — PropertyDetailView(편지지)만 사용.
 */
export function InterceptedMyPropertyDetailView({ vm }: Props) {
  const {
    currentLanguage,
    property,
    loading,
    handleBack,
    handleEdit,
  } = vm;

  if (loading) {
    return (
      <div
        className="fixed inset-0 z-[90] bg-black/50 flex items-center justify-center p-4"
        onClick={handleBack}
      >
        <div className="text-white" onClick={(e) => e.stopPropagation()}>
          {getUIText("loading", currentLanguage as SupportedLanguage)}
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div
        className="fixed inset-0 z-[90] bg-black/50 flex items-center justify-center p-4"
        onClick={handleBack}
      >
        <div
          className="bg-white rounded-2xl p-6 max-w-[430px] text-center"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-gray-500 mb-4">
            {getUIText("propertyNotFound", currentLanguage as SupportedLanguage)}
          </p>
          <button
            type="button"
            onClick={handleBack}
            className="px-4 py-2 rounded-lg text-white"
            style={{ backgroundColor: "#E63946" }}
          >
            {getUIText("back", currentLanguage as SupportedLanguage)}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[90] bg-black/50 flex items-center justify-center p-4"
      onClick={handleBack}
    >
      <AppBox
        className="modal-app-box w-full max-w-[430px] rounded-2xl shadow-2xl bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        <PropertyDetailView
          property={property}
          currentLanguage={currentLanguage as SupportedLanguage}
          mode="owner"
          onBack={handleBack}
          onEdit={handleEdit}
        />
      </AppBox>
    </div>
  );
}
