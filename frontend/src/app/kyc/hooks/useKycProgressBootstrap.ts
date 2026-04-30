"use client";

import { useEffect, useState } from "react";
import type { SupportedLanguage } from "@/lib/api/translation";
import {
  type FaceVerificationData,
  type IdDocumentData,
  type PhoneVerificationData,
} from "@/types/kyc.types";
import { loadKycProgressFromUser } from "./loadKycProgressFromUser";
import { getUIText } from "@/utils/i18n";
import type { KycPageStep } from "../kycPageViewModel.types";

type UseKycProgressBootstrapArgs = {
  userId: string | undefined;
  currentLanguage: SupportedLanguage;
  setPageError: (message: string) => void;
};

/** 진입 시 `loadKycProgressFromUser`로 스텝·폼 상태 복원 (단계 액션은 `useKycPageState`). */
export function useKycProgressBootstrap({
  userId,
  currentLanguage,
  setPageError,
}: UseKycProgressBootstrapArgs) {
  const [currentStep, setCurrentStep] = useState<KycPageStep>(1);
  const [phoneData, setPhoneData] = useState<PhoneVerificationData | null>(null);
  const [idDocumentData, setIdDocumentData] = useState<IdDocumentData | null>(null);
  const [faceData, setFaceData] = useState<FaceVerificationData | null>(null);

  useEffect(() => {
    if (!userId) return;

    const loadCompletedSteps = async () => {
      try {
        setPageError("");
        const p = await loadKycProgressFromUser(userId);
        if (p.phoneData) setPhoneData(p.phoneData);
        if (p.idDocumentData) setIdDocumentData(p.idDocumentData);
        if (p.faceData) setFaceData(p.faceData);
        if (p.currentStepToShow !== undefined) {
          setCurrentStep(p.currentStepToShow);
        }
      } catch (loadError) {
        console.error("Error loading completed steps:", loadError);
        setPageError(getUIText("kycProgressLoadError", currentLanguage));
      }
    };

    void loadCompletedSteps();
  }, [userId, currentLanguage, setPageError]);

  return {
    currentStep,
    setCurrentStep,
    phoneData,
    setPhoneData,
    idDocumentData,
    setIdDocumentData,
    faceData,
    setFaceData,
  };
}
