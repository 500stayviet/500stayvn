import type { Dispatch, SetStateAction } from "react";
import type { SupportedLanguage } from "@/lib/api/translation";
import type {
  FaceVerificationData,
  IdDocumentData,
  PhoneVerificationData,
} from "@/types/kyc.types";

/** KYC 마법사 스텝 인덱스 (화면·API 공통). */
export type KycPageStep = 1 | 2 | 3;

/** `KycStepProgress` 스텝퍼 한 칸. */
export type KycStepperStep = {
  number: KycPageStep;
  title: string;
  completed: boolean;
};

/** `useAuth`가 넘기는 사용자 슬라이스와 동일한 최소 형태. */
export type KycPageUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
};

/**
 * KYC 페이지 UI(`KycPageView`)에 넘기는 view-model.
 * 조합: `useKycProgressBootstrap` + `useKycPageActions` + 스텝퍼 메타데이터.
 */
export interface KycPageViewModel {
  user: KycPageUser | null;
  authLoading: boolean;
  currentLanguage: SupportedLanguage;
  setCurrentLanguage: (lang: SupportedLanguage) => Promise<void>;
  currentStep: KycPageStep;
  loading: boolean;
  error: string;
  showStep2SuccessModal: boolean;
  setShowStep2SuccessModal: Dispatch<SetStateAction<boolean>>;
  phoneData: PhoneVerificationData | null;
  steps: KycStepperStep[];
  handlePhoneVerificationComplete: (data: PhoneVerificationData) => void | Promise<void>;
  handleIdDocumentComplete: (
    data: IdDocumentData,
    frontImageFile: File,
    backImageFile?: File,
  ) => void | Promise<void>;
  handleIdDocumentNext: () => void | Promise<void>;
  handleFaceVerificationComplete: (
    data: FaceVerificationData,
    images: { direction: string; file: File }[],
  ) => void | Promise<void>;
}
