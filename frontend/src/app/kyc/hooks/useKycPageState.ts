"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  type FaceVerificationData,
  type IdDocumentData,
  type PhoneVerificationData,
} from "@/types/kyc.types";
import { getKycProvider } from "@/lib/providers/currentProviders";
import { loadKycProgressFromUser } from "./loadKycProgressFromUser";

type KYCStep = 1 | 2 | 3;

export function useKycPageState() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { currentLanguage, setCurrentLanguage } = useLanguage();
  const [currentStep, setCurrentStep] = useState<KYCStep>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showStep2SuccessModal, setShowStep2SuccessModal] = useState(false);
  const [phoneData, setPhoneData] = useState<PhoneVerificationData | null>(null);
  const [idDocumentData, setIdDocumentData] = useState<IdDocumentData | null>(null);
  const [faceData, setFaceData] = useState<FaceVerificationData | null>(null);
  const kycProvider = getKycProvider();

  const toErrorMessage = (error: unknown): string => {
    if (error instanceof Error && error.message) return error.message;
    return "KYC step failed";
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;

    const loadCompletedSteps = async () => {
      try {
        setError("");
        const p = await loadKycProgressFromUser(user.uid);
        if (p.phoneData) setPhoneData(p.phoneData);
        if (p.idDocumentData) setIdDocumentData(p.idDocumentData);
        if (p.faceData) setFaceData(p.faceData);
        if (p.currentStepToShow !== undefined) {
          setCurrentStep(p.currentStepToShow);
        }
      } catch (loadError) {
        console.error("Error loading completed steps:", loadError);
        setError(
          currentLanguage === "ko"
            ? "인증 진행 상황을 불러오지 못했습니다. 새로고침 후 다시 시도해 주세요."
            : "Could not load KYC progress. Please refresh and try again.",
        );
      }
    };

    void loadCompletedSteps();
  }, [user, currentLanguage]);

  const handlePhoneVerificationComplete = async (data: PhoneVerificationData) => {
    if (!user) return;
    setLoading(true);
    setError("");

    try {
      await kycProvider.savePhoneVerification(user.uid, data);
      setPhoneData(data);
      setCurrentStep(2);
    } catch (verifyError: unknown) {
      console.error("Phone verification error:", verifyError);
      setError(toErrorMessage(verifyError));
    } finally {
      setLoading(false);
    }
  };

  const handleIdDocumentComplete = async (
    data: IdDocumentData,
    frontImageFile: File,
    backImageFile?: File,
  ) => {
    if (!user) return;
    setLoading(true);
    setError("");

    try {
      try {
        await kycProvider.saveIdDocument(user.uid, data, frontImageFile, backImageFile);
      } catch (apiError) {
        const message = toErrorMessage(apiError);
        if (message.includes("mock_kyc_id_failed")) {
          setError(message);
          return;
        }
        setError(message);
        return;
      }

      setIdDocumentData(data);
      setCurrentStep(3);
      setShowStep2SuccessModal(true);
    } catch (uploadError: unknown) {
      console.error("ID document upload error:", uploadError);
      setError(toErrorMessage(uploadError));
    } finally {
      setLoading(false);
    }
  };

  const handleIdDocumentNext = async () => {
    if (!user) return;
    setLoading(true);
    setError("");

    const dummyIdData: IdDocumentData = {
      type: "id_card",
      idNumber: "TEST123456",
      fullName: "Test User",
      dateOfBirth: "1990-01-01",
    };

    const createDummyFile = (name: string, text: string): File => {
      const canvas = document.createElement("canvas");
      canvas.width = 800;
      canvas.height = 500;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#f0f0f0";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#333";
        ctx.font = "24px Arial";
        ctx.fillText(text, 50, 250);
      }
      const blob = new Blob([""], { type: "image/jpeg" });
      return new File([blob], name, { type: "image/jpeg" });
    };

    try {
      const dummyFrontFile = createDummyFile("test-id-front.jpg", "Test ID Front");
      const dummyBackFile = createDummyFile("test-id-back.jpg", "Test ID Back");

      try {
        await kycProvider.saveIdDocument(user.uid, dummyIdData, dummyFrontFile, dummyBackFile);
      } catch (apiError) {
        const message = toErrorMessage(apiError);
        if (message.includes("mock_kyc_id_failed")) {
          setError(message);
          return;
        }
        setError(message);
        return;
      }

      setIdDocumentData(dummyIdData);
      setCurrentStep(3);
      setShowStep2SuccessModal(true);
    } catch (nextError: unknown) {
      console.error("ID document next error:", nextError);
      setError(toErrorMessage(nextError));
    } finally {
      setLoading(false);
    }
  };

  const handleFaceVerificationComplete = async (
    data: FaceVerificationData,
    images: { direction: string; file: File }[],
  ) => {
    if (!user) return;
    setLoading(true);
    setError("");

    try {
      await kycProvider.saveFaceVerification(user.uid, images);
      setFaceData(data);
      await kycProvider.completeKYCVerification(user.uid);
      router.push("/profile");
    } catch (faceError: unknown) {
      console.error("Face verification error:", faceError);
      setError(toErrorMessage(faceError));
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    {
      number: 1 as const,
      title: currentLanguage === "ko" ? "전화번호 인증" : "Phone Verification",
      completed: phoneData !== null,
    },
    {
      number: 2 as const,
      title: currentLanguage === "ko" ? "신분증 촬영" : "ID Capture",
      completed: idDocumentData !== null,
    },
    {
      number: 3 as const,
      title: currentLanguage === "ko" ? "얼굴 인증" : "Face Verification",
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

export type KycPageViewModel = ReturnType<typeof useKycPageState>;
