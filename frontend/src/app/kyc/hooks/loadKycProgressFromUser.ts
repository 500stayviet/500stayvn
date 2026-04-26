import type { IdDocumentData, PhoneVerificationData, FaceVerificationData } from '@/types/kyc.types';

type KYCStep = 1 | 2 | 3;

type KycProgress = {
  /** 누락된 스텝이 있을 때만 설정 (이전 `setCurrentStep` 3가지와 동일). */
  currentStepToShow?: KYCStep;
  phoneData: PhoneVerificationData | null;
  idDocumentData: IdDocumentData | null;
  faceData: FaceVerificationData | null;
};

/**
 * 서버( auth userData )에 저장된 kyc_steps / 전화 기준으로 캐시·표시할 스텝 복원.
 */
export async function loadKycProgressFromUser(userId: string): Promise<KycProgress> {
  const { getCurrentUserData } = await import('@/lib/api/auth');
  const userData = await getCurrentUserData(userId);
  const kycSteps = userData?.kyc_steps || {};

  let phoneData: PhoneVerificationData | null = null;
  let idDocumentData: IdDocumentData | null = null;
  let faceData: FaceVerificationData | null = null;

  if (kycSteps.step1) {
    phoneData = { phoneNumber: userData?.phoneNumber || '' } as PhoneVerificationData;
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
