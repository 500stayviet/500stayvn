import type { IdDocumentData, PhoneVerificationData, FaceVerificationData } from '@/types/kyc.types';
import type { UserData } from '@/lib/api/auth';

type KYCStep = 1 | 2 | 3;

type KycProgress = {
  /** 누락된 스텝이 있을 때만 설정 (이전 `setCurrentStep` 3가지와 동일). */
  currentStepToShow?: KYCStep;
  phoneData: PhoneVerificationData | null;
  idDocumentData: IdDocumentData | null;
  faceData: FaceVerificationData | null;
};

/**
 * 서버 GET /api/app/users + LessorProfile 병합(kyc_steps) 기준으로 재개 스텝 복원.
 * 로컬 캐시는 네트워크 실패 시에만 폴백.
 */
export async function loadKycProgressFromUser(userId: string): Promise<KycProgress> {
  let userData: UserData | null = null;
  try {
    const { withAppActor } = await import('@/lib/api/withAppActor');
    const { parseAppUserPayload } = await import('@/lib/api/appUserApiParse');
    const res = await fetch(
      `/api/app/users/${encodeURIComponent(userId)}`,
      withAppActor({ cache: 'no-store' }),
    );
    if (res.ok) {
      userData = parseAppUserPayload(await res.json());
    }
  } catch {
    /* 네트워크 오류 시 로컬 폴백 */
  }
  if (!userData) {
    const { getCurrentUserData } = await import('@/lib/api/auth');
    userData = await getCurrentUserData(userId);
  }
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
