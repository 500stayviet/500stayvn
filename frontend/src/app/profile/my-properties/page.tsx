"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import TopBar from "@/components/TopBar";
import { getUIText } from "@/utils/i18n";
import { HostInventoryTab, useMyPropertiesPageState } from "./hooks/useMyPropertiesPageState";
import MyPropertiesListSection from "./components/MyPropertiesListSection";
import MyPropertiesDialogs from "./components/MyPropertiesDialogs";
import type { SupportedLanguage } from "@/lib/api/translation";
import MyPropertiesHeaderSection from "./components/MyPropertiesHeaderSection";

function MyPropertiesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { currentLanguage, setCurrentLanguage } = useLanguage();
  const toSupportedLanguage = (lang: string): SupportedLanguage =>
    lang === "ko" || lang === "vi" || lang === "ja" || lang === "zh" ? lang : "en";
  const uiLanguage = toSupportedLanguage(currentLanguage);
  const state = useMyPropertiesPageState({
    user: user ? { uid: user.uid } : null,
    authLoading,
    router,
    searchParams,
  });

  if (authLoading || state.loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        {getUIText("loading", currentLanguage)}
      </div>
    );

  return (
    <div
      className="min-h-screen bg-gray-100 flex justify-center"
      data-testid="my-properties-content"
    >
      <div className="w-full max-w-[430px] bg-white min-h-screen shadow-2xl flex flex-col relative pb-10">
        <TopBar currentLanguage={currentLanguage} onLanguageChange={setCurrentLanguage} />

        <div className="px-5 py-6">
          <MyPropertiesHeaderSection
            currentLanguage={uiLanguage}
            activeTab={state.activeTab}
            tabCount={state.tabCount}
            onGoBack={() => router.push("/profile")}
            onGoTab={state.goTab}
          />

          <MyPropertiesListSection
            properties={state.properties}
            activeTab={state.activeTab}
            currentLanguage={uiLanguage}
            onOpenProperty={(propertyId) => router.push(`/profile/my-properties/${propertyId}`)}
            onEndAd={(propertyId) => void state.handleEndAd(propertyId)}
            onEditPending={(property) => state.openEditWithLiveDuplicateCheck(property, "pending")}
            onMovePendingToEnded={(propertyId) => state.setShowEndAdFromPendingConfirm(propertyId)}
            onEditEnded={(property) => state.openEditWithLiveDuplicateCheck(property, "ended")}
            onDeleteEnded={(propertyId) => state.setShowDeleteConfirm(propertyId)}
          />
        </div>

        <MyPropertiesDialogs
          currentLanguage={uiLanguage}
          showDeleteConfirm={state.showDeleteConfirm}
          deletingId={state.deletingId}
          showEndAdFromPendingConfirm={state.showEndAdFromPendingConfirm}
          liveExistsConfirm={state.liveExistsConfirm}
          onCloseDeleteConfirm={() => state.setShowDeleteConfirm(null)}
          onConfirmDelete={(id) => void state.handleDelete(id)}
          onClosePendingEndConfirm={() => state.setShowEndAdFromPendingConfirm(null)}
          onConfirmPendingEnd={(id) => void state.handleConfirmPendingEnd(id)}
          onCloseLiveExistsConfirm={() => state.setLiveExistsConfirm(null)}
          onConfirmLiveExists={state.handleConfirmLiveExists}
        />
      </div>
    </div>
  );
}

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
      <MyPropertiesContent />
    </Suspense>
  );
}
