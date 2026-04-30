"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { getKycProvider } from "@/lib/providers/currentProviders";
import { getUIText } from "@/utils/i18n";
import type { KycPageViewModel } from "../kycPageViewModel.types";
import { useKycProgressBootstrap } from "./useKycProgressBootstrap";
import { useKycPageActions } from "./useKycPageActions";

export function useKycPageState(): KycPageViewModel {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { currentLanguage, setCurrentLanguage } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showStep2SuccessModal, setShowStep2SuccessModal] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const {
    currentStep,
    setCurrentStep,
    phoneData,
    setPhoneData,
    idDocumentData,
    setIdDocumentData,
    faceData,
    setFaceData,
  } = useKycProgressBootstrap({
    userId: user?.uid,
    currentLanguage,
    setPageError: setError,
  });

  const kycProvider = getKycProvider();

  const {
    handlePhoneVerificationComplete,
    handleIdDocumentComplete,
    handleIdDocumentNext,
    handleFaceVerificationComplete,
  } = useKycPageActions({
    userId: user?.uid,
    kycProvider,
    currentLanguage,
    setLoading,
    setError,
    setPhoneData,
    setIdDocumentData,
    setFaceData,
    setCurrentStep,
    setShowStep2SuccessModal,
    router,
  });

  const steps = [
    {
      number: 1 as const,
      title: getUIText("kycPhoneVerificationHeading", currentLanguage),
      completed: phoneData !== null,
    },
    {
      number: 2 as const,
      title: getUIText("kycIdDocumentStepTitle", currentLanguage),
      completed: idDocumentData !== null,
    },
    {
      number: 3 as const,
      title: getUIText("kycFaceVerificationStepTitle", currentLanguage),
      completed: faceData !== null,
    },
  ];

  return {
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
  };
}

export type { KycPageViewModel } from "../kycPageViewModel.types";
