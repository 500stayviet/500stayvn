"use client";

import type { Dispatch, SetStateAction } from "react";
import type { SupportedLanguage } from "@/lib/api/translation";
import type { KycProvider } from "@/lib/providers/interfaces";
import {
  type FaceVerificationData,
  type IdDocumentData,
  type PhoneVerificationData,
} from "@/types/kyc.types";
import { getUIText } from "@/utils/i18n";
import type { KycPageStep } from "../kycPageViewModel.types";

type UseKycPageActionsArgs = {
  userId: string | undefined;
  kycProvider: KycProvider;
  currentLanguage: SupportedLanguage;
  setLoading: (loading: boolean) => void;
  setError: (message: string) => void;
  setPhoneData: Dispatch<SetStateAction<PhoneVerificationData | null>>;
  setIdDocumentData: Dispatch<SetStateAction<IdDocumentData | null>>;
  setFaceData: Dispatch<SetStateAction<FaceVerificationData | null>>;
  setCurrentStep: Dispatch<SetStateAction<KycPageStep>>;
  setShowStep2SuccessModal: Dispatch<SetStateAction<boolean>>;
  router: { push: (href: string) => void };
};

/** KYC 단계별 `KycProvider` 호출, 로컬 스텝·데이터 갱신, 라우팅. */
export function useKycPageActions({
  userId,
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
}: UseKycPageActionsArgs) {
  const toErrorMessage = (error: unknown): string => {
    if (error instanceof Error && error.message) return error.message;
    return getUIText("kycStepFailedGeneric", currentLanguage);
  };

  const handlePhoneVerificationComplete = async (data: PhoneVerificationData) => {
    if (!userId) return;
    setLoading(true);
    setError("");

    try {
      await kycProvider.savePhoneVerification(userId, data);
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
    if (!userId) return;
    setLoading(true);
    setError("");

    try {
      try {
        await kycProvider.saveIdDocument(userId, data, frontImageFile, backImageFile);
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
    if (!userId) return;
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
        await kycProvider.saveIdDocument(userId, dummyIdData, dummyFrontFile, dummyBackFile);
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
    if (!userId) return;
    setLoading(true);
    setError("");

    try {
      await kycProvider.saveFaceVerification(userId, images);
      setFaceData(data);
      await kycProvider.completeKYCVerification(userId);
      router.push("/profile");
    } catch (faceError: unknown) {
      console.error("Face verification error:", faceError);
      setError(toErrorMessage(faceError));
    } finally {
      setLoading(false);
    }
  };

  return {
    handlePhoneVerificationComplete,
    handleIdDocumentComplete,
    handleIdDocumentNext,
    handleFaceVerificationComplete,
  };
}
