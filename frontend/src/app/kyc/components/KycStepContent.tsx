"use client";

import { AnimatePresence, motion } from "framer-motion";
import PhoneVerificationStep from "@/components/kyc/PhoneVerificationStep";
import IdDocumentStep from "@/components/kyc/IdDocumentStep";
import FaceVerificationStep from "@/components/kyc/FaceVerificationStep";
import type {
  FaceVerificationData,
  IdDocumentData,
  PhoneVerificationData,
} from "@/types/kyc.types";
import type { SupportedLanguage } from "@/lib/api/translation";

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
              onComplete={onPhoneVerificationComplete}
              initialPhoneNumber={initialPhoneNumber}
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
              onComplete={onIdDocumentComplete}
              onNext={onIdDocumentNext}
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
              onComplete={onFaceVerificationComplete}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
