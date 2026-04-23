/**
 * KYC (Know Your Customer) 인증 페이지
 * * 임대인 인증을 위한 단계별 인증 프로세스
 * Step 1: 전화번호 인증
 * Step 2: 신분증 촬영
 * Step 3: 얼굴 인증
 */

"use client";
import TopBar from "@/components/TopBar";
import { useKycPageState } from "./hooks/useKycPageState";
import KycStepProgress from "./components/KycStepProgress";
import KycStep2SuccessModal from "./components/KycStep2SuccessModal";
import KycStepContent from "./components/KycStepContent";
import KycPageHeader from "./components/KycPageHeader";
import KycLoadingOverlay from "./components/KycLoadingOverlay";

export default function KYCPage() {
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
  } = useKycPageState();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">
          {currentLanguage === "ko" ? "로딩 중..." : "Đang tải..."}
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
