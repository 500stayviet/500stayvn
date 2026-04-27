import type { UserData } from "@/lib/api/auth";
import type { IdDocumentData, PhoneVerificationData, FaceVerificationData } from "@/types/kyc.types";

type KYCStep = 1 | 2 | 3;

export type KycResumeState = {
  currentStepToShow?: KYCStep;
  phoneData: PhoneVerificationData | null;
  idDocumentData: IdDocumentData | null;
  faceData: FaceVerificationData | null;
};

/**
 * `UserData.kyc_steps`·연락처로 KYC 재개 화면 상태를 만든다 (순수, 테스트용).
 */
export function deriveKycResumeState(userData: UserData | null): KycResumeState {
  const kycSteps = userData?.kyc_steps || {};

  let phoneData: PhoneVerificationData | null = null;
  let idDocumentData: IdDocumentData | null = null;
  let faceData: FaceVerificationData | null = null;

  if (kycSteps.step1) {
    phoneData = { phoneNumber: userData?.phoneNumber || "" } as PhoneVerificationData;
  }
  if (kycSteps.step2) {
    idDocumentData = {} as IdDocumentData;
  }
  if (kycSteps.step3) {
    faceData = {} as FaceVerificationData;
  }

  let currentStepToShow: KYCStep | undefined;
  if (!kycSteps.step1) currentStepToShow = 1;
  else if (!kycSteps.step2) currentStepToShow = 2;
  else if (!kycSteps.step3) currentStepToShow = 3;

  return { currentStepToShow, phoneData, idDocumentData, faceData };
}
