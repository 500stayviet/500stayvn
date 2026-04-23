/**
 * KYC (Know Your Customer) 인증 페이지
 * * 임대인 인증을 위한 단계별 인증 프로세스
 * Step 1: 전화번호 인증
 * Step 2: 신분증 촬영
 * Step 3: 얼굴 인증
 */

"use client";
import { motion, AnimatePresence } from "framer-motion";
import PhoneVerificationStep from "@/components/kyc/PhoneVerificationStep";
import IdDocumentStep from "@/components/kyc/IdDocumentStep";
import FaceVerificationStep from "@/components/kyc/FaceVerificationStep";
import TopBar from "@/components/TopBar";
import { useKycPageState } from "./hooks/useKycPageState";
import KycStepProgress from "./components/KycStepProgress";
import KycStep2SuccessModal from "./components/KycStep2SuccessModal";

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
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              {currentLanguage === "ko" ? "임대인 인증" : "Host Verification"}
            </h1>
            <p className="text-sm text-gray-600">
              {currentLanguage === "ko"
                ? "3단계 인증을 완료해주세요"
                : "Please complete the 3-step verification"}
            </p>
          </div>

          <KycStepProgress currentStep={currentStep} steps={steps} />

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <AnimatePresence mode="sync">
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <PhoneVerificationStep
                    currentLanguage={currentLanguage}
                    onComplete={handlePhoneVerificationComplete}
                    initialPhoneNumber={phoneData?.phoneNumber}
                  />
                </motion.div>
              )}
              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <IdDocumentStep
                    currentLanguage={currentLanguage}
                    onComplete={handleIdDocumentComplete}
                    onNext={handleIdDocumentNext}
                  />
                </motion.div>
              )}
              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <FaceVerificationStep
                    currentLanguage={currentLanguage}
                    onComplete={handleFaceVerificationComplete}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {loading && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-2xl p-6 flex flex-col items-center gap-4">
                <div className="animate-spin h-8 w-8 text-blue-600 border-4 border-t-transparent rounded-full"></div>
                <p className="text-sm text-gray-700">
                  {currentLanguage === "ko" ? "처리 중..." : "Đang xử lý..."}
                </p>
              </div>
            </div>
          )}

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
