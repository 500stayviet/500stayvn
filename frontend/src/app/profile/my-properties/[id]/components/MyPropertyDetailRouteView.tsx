"use client";

import TopBar from "@/components/TopBar";
import PropertyDetailView from "@/components/PropertyDetailView";
import type { SupportedLanguage } from "@/lib/api/translation";
import type { MyPropertyDetailRoutePageViewModel } from "../hooks/useMyPropertyDetailRoutePage";

type Props = { vm: MyPropertyDetailRoutePageViewModel };

/** `/profile/my-properties/[id]` 직접 진입 UI — 상태는 훅에서만 만든다. */
export function MyPropertyDetailRouteView({ vm }: Props) {
  const {
    user,
    authLoading,
    currentLanguage,
    setCurrentLanguage,
    property,
    loading,
    onBackToList,
    onEdit,
  } = vm;

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">
          {currentLanguage === "ko"
            ? "로딩 중..."
            : currentLanguage === "vi"
              ? "Đang tải..."
              : "Loading..."}
        </div>
      </div>
    );
  }

  if (!property || !user) {
    return null;
  }

  return (
    <div
      className="min-h-screen flex justify-center"
      style={{ backgroundColor: "#FFF8F0" }}
    >
      <div className="w-full max-w-[430px] min-h-screen shadow-2xl flex flex-col relative">
        <TopBar
          currentLanguage={currentLanguage}
          onLanguageChange={setCurrentLanguage}
          hideLanguageSelector={false}
        />
        <PropertyDetailView
          property={property}
          currentLanguage={currentLanguage as SupportedLanguage}
          mode="owner"
          onBack={onBackToList}
          onEdit={onEdit}
        />
      </div>
    </div>
  );
}
