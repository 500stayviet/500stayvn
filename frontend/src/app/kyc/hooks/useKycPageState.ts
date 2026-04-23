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
import {
  completeKYCVerification,
  saveFaceVerification,
  saveIdDocument,
  savePhoneVerification,
} from "@/lib/api/kyc";
import { getCurrentUserData } from "@/lib/api/auth";

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

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;

    const loadCompletedSteps = async () => {
      try {
        const userData = await getCurrentUserData(user.uid);
        const kycSteps = userData?.kyc_steps || {};

        if (kycSteps.step1) {
          setPhoneData({ phoneNumber: userData?.phoneNumber || "" });
        }
        if (kycSteps.step2) {
          setIdDocumentData({} as IdDocumentData);
        }
        if (kycSteps.step3) {
          setFaceData({} as FaceVerificationData);
        }

        if (!kycSteps.step1) setCurrentStep(1);
        else if (!kycSteps.step2) setCurrentStep(2);
        else if (!kycSteps.step3) setCurrentStep(3);
      } catch (loadError) {
        console.error("Error loading completed steps:", loadError);
      }
    };

    void loadCompletedSteps();
  }, [user]);

  const handlePhoneVerificationComplete = async (data: PhoneVerificationData) => {
    if (!user) return;
    setLoading(true);
    setError("");

    try {
      try {
        await savePhoneVerification(user.uid, data);
      } catch (apiError) {
        console.log("Test mode: Phone verification API failed, continuing anyway:", apiError);
      }

      setPhoneData(data);
      setCurrentStep(2);
      console.log("Phone verification step completed (test mode)");
    } catch (verifyError: unknown) {
      console.error("Phone verification error:", verifyError);
      setPhoneData(data);
      setCurrentStep(2);
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
        await saveIdDocument(user.uid, data, frontImageFile, backImageFile);
      } catch (apiError) {
        console.log("Test mode: ID document upload API failed, continuing anyway:", apiError);
      }

      setIdDocumentData(data);
      setCurrentStep(3);
      setShowStep2SuccessModal(true);
    } catch (uploadError: unknown) {
      console.error("ID document upload error:", uploadError);
      setIdDocumentData(data);
      setCurrentStep(3);
      console.log("Test mode: Moving to step 3 despite error");
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
        await saveIdDocument(user.uid, dummyIdData, dummyFrontFile, dummyBackFile);
      } catch (apiError) {
        console.log("Test mode: ID document next API failed, continuing anyway:", apiError);
      }

      setIdDocumentData(dummyIdData);
      setCurrentStep(3);
      setShowStep2SuccessModal(true);
    } catch (nextError: unknown) {
      console.error("ID document next error:", nextError);
      setIdDocumentData(dummyIdData);
      setCurrentStep(3);
      console.log("Test mode: Moving to step 3 despite error");
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
      await saveFaceVerification(user.uid, images);
      setFaceData(data);
      await completeKYCVerification(user.uid);
      router.push("/profile");
    } catch (faceError: unknown) {
      console.error("Face verification error:", faceError);
      router.push("/profile");
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
