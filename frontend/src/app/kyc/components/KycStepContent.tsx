"use client";

import dynamic from "next/dynamic";
import type {
  FaceVerificationData,
  IdDocumentData,
  PhoneVerificationData,
} from "@/types/kyc.types";
import type { SupportedLanguage } from "@/lib/api/translation";

const PhoneVerificationStep = dynamic(
  () => import("@/components/kyc/PhoneVerificationStep"),
  { ssr: false },
);
const IdDocumentStep = dynamic(() => import("@/components/kyc/IdDocumentStep"), {
  ssr: false,
});
const FaceVerificationStep = dynamic(
  () => import("@/components/kyc/FaceVerificationStep"),
  { ssr: false },
);

interface KycStepContentProps {
  currentStep: 1 | 2 | 3;
  currentLanguage: SupportedLanguage;
  initialPhoneNumber?: string;
  onPhoneVerificationComplete: (data: PhoneVerificationData) => void | Promise<void>;
  onIdDocumentComplete: (
    data: IdDocumentData,
    frontImageFile: File,
    backImageFile?: File,
  ) => void | Promise<void>;
  onIdDocumentNext: () => void | Promise<void>;
  onFaceVerificationComplete: (
    data: FaceVerificationData,
    images: { direction: string; file: File }[],
  ) => void | Promise<void>;
}

export default function KycStepContent({
  currentStep,
  currentLanguage,
  initialPhoneNumber,
  onPhoneVerificationComplete,
  onIdDocumentComplete,
  onIdDocumentNext,
  onFaceVerificationComplete,
}: KycStepContentProps) {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
      {currentStep === 1 && (
        <div key="step1" className="transition-opacity duration-200 opacity-100">
          <PhoneVerificationStep
            currentLanguage={currentLanguage}
            onComplete={onPhoneVerificationComplete}
            initialPhoneNumber={initialPhoneNumber}
          />
        </div>
      )}
      {currentStep === 2 && (
        <div key="step2" className="transition-opacity duration-200 opacity-100">
          <IdDocumentStep
            currentLanguage={currentLanguage}
            onComplete={onIdDocumentComplete}
            onNext={onIdDocumentNext}
          />
        </div>
      )}
      {currentStep === 3 && (
        <div key="step3" className="transition-opacity duration-200 opacity-100">
          <FaceVerificationStep
            currentLanguage={currentLanguage}
            onComplete={onFaceVerificationComplete}
          />
        </div>
      )}
    </div>
  );
}
