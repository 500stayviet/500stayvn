"use client";

import TopBar from "@/components/TopBar";
import { getUIText } from "@/utils/i18n";
import KycStepProgress from "./KycStepProgress";
import KycStep2SuccessModal from "./KycStep2SuccessModal";
import KycStepContent from "./KycStepContent";
import KycPageHeader from "./KycPageHeader";
import KycLoadingOverlay from "./KycLoadingOverlay";
import type { KycPageViewModel } from "../kycPageViewModel.types";

export type KycPageViewProps = {
  vm: KycPageViewModel;
};

export function KycPageView({ vm }: KycPageViewProps) {
  const {
    user,
    authLoading,
    currentLanguage,
    setCurrentLanguage,
    currentStep,
    loading,
    error,
    showStep2SuccessModal,
    setShowStep2SuccessModal,
    phoneData,
    steps,
    handlePhoneVerificationComplete,
    handleIdDocumentComplete,
    handleIdDocumentNext,
    handleFaceVerificationComplete,
  } = vm;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">
          {getUIText("loading", currentLanguage)}
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center">
      <div className="w-full max-w-[430px] bg-white min-h-screen shadow-2xl flex flex-col relative">
        <TopBar
          currentLanguage={currentLanguage}
          onLanguageChange={setCurrentLanguage}
        />

        <div className="px-6 py-6">
          <KycPageHeader currentLanguage={currentLanguage} />

          <KycStepProgress currentStep={currentStep} steps={steps} />

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          <KycStepContent
            currentStep={currentStep}
            currentLanguage={currentLanguage}
            initialPhoneNumber={phoneData?.phoneNumber}
            onPhoneVerificationComplete={handlePhoneVerificationComplete}
            onIdDocumentComplete={handleIdDocumentComplete}
            onIdDocumentNext={handleIdDocumentNext}
            onFaceVerificationComplete={handleFaceVerificationComplete}
          />

          {loading && <KycLoadingOverlay currentLanguage={currentLanguage} />}

          {showStep2SuccessModal && (
            <KycStep2SuccessModal
              currentLanguage={currentLanguage}
              onClose={() => setShowStep2SuccessModal(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
