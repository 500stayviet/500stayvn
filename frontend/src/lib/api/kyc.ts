/**
 * KYC (Know Your Customer) 인증 API (테스트 데이터 저장 모드)
 * * 임대인 인증을 위한 데이터 저장 로직
 * 이미지 파일은 서버의 public/uploads/verification/[userId] 폴더에 저장됩니다.
 */

import {
  PhoneVerificationData,
  IdDocumentData,
} from "@/types/kyc.types";
import { logAdminSystemEvent } from "@/lib/adminSystemLog";
import { withAppActor } from "@/lib/api/withAppActor";
import { mergeAuthenticatedUserIntoCache } from "@/lib/api/auth";
import { parseAppUserPayload } from "@/lib/api/appUserApiParse";

/**
 * 파일 업로드 유틸리티 함수
 */
async function uploadFile(
  userId: string,
  fileType: string,
  file: File
): Promise<string> {
  const formData = new FormData();
  formData.append('userId', userId);
  formData.append('fileType', fileType);
  formData.append('file', file);

  const response = await fetch('/api/kyc/upload', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'File upload failed');
  }

  const data = await response.json();
  return data.filePath;
}

/**
 * KYC 단계 완료 처리
 */
async function completeKYCStep(
  userId: string,
  step: number,
  idData?: PhoneVerificationData | IdDocumentData | Record<string, unknown>,
): Promise<{ success: boolean; testModeMessage: string }> {
  const response = await fetch('/api/kyc/upload', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId, step, idData }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'KYC step completion failed');
  }

  const result = await response.json();
  
  // KYC 진행 상태는 User 원장에도 기록해 관리자/프로필 조회의 단일 진실로 유지
  try {
    const kycSteps: { step1?: boolean; step2?: boolean; step3?: boolean } = {};
    if (step >= 1) kycSteps.step1 = true;
    if (step >= 2) kycSteps.step2 = true;
    if (step >= 3) kycSteps.step3 = true;

    const userPatch: Record<string, unknown> = { kyc_steps: kycSteps };
    if (step < 3) userPatch.verification_status = 'pending';
    if (step === 3) {
      userPatch.verification_status = 'verified';
      /** 앱 원장 규칙: PATCH 시 `role: owner` → DB에 isOwner + 세션과 동일한 UserData */
      userPatch.role = 'owner';
    }

    const patchRes = await fetch(
      `/api/app/users/${encodeURIComponent(userId)}`,
      withAppActor({
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userPatch),
      }),
    );
    if (patchRes.ok) {
      const updated = parseAppUserPayload(await patchRes.json());
      if (updated) mergeAuthenticatedUserIntoCache(updated);
    }
  } catch (error) {
    logAdminSystemEvent({
      severity: 'warning',
      category: 'kyc',
      message: 'KYC 단계 반영 중 users 원장 동기화 실패',
      ownerId: userId,
      snapshot: { function: 'completeKYCStep', step: String(step), error: String(error) },
    });
  }
  
  return result;
}

/**
 * [Step 1] 전화번호 인증 완료 후 데이터 저장
 */
export async function savePhoneVerification(
  uid: string,
  data: PhoneVerificationData,
): Promise<void> {
  try {
    const result = await completeKYCStep(uid, 1, data);
    console.log('Phone verification completed:', result.testModeMessage);
  } catch (error) {
    console.error("Error saving phone verification:", error);
    logAdminSystemEvent({
      severity: 'error',
      category: 'kyc',
      message: error instanceof Error ? error.message : '전화 인증 저장 실패',
      ownerId: uid,
      snapshot: { function: 'savePhoneVerification' },
    });
    throw error;
  }
}

/**
 * [Step 2] 신분증 정보 및 이미지 파일 저장
 */
export async function saveIdDocument(
  uid: string,
  idData: IdDocumentData,
  frontImageFile: File,
  backImageFile?: File,
): Promise<void> {
  try {
    // TODO: Production 환경에서 실제 인증 API 호출
    // 현재는 테스트 모드로 파일 저장만 수행

    // 신분증 앞면 업로드
    void (await uploadFile(uid, 'id_front', frontImageFile));

    // 신분증 뒷면 업로드 (있는 경우)
    if (backImageFile) {
      void (await uploadFile(uid, 'id_back', backImageFile));
    }

    // 여권인 경우 여권 이미지 업로드
    if (idData.type === 'passport') {
      await uploadFile(uid, 'passport', frontImageFile);
    }

    // KYC 단계 2 완료 처리
    const result = await completeKYCStep(uid, 2, idData);
    console.log('ID document verification completed:', result.testModeMessage);
  } catch (error) {
    console.error("Error saving ID document:", error);
    logAdminSystemEvent({
      severity: 'error',
      category: 'kyc',
      message: error instanceof Error ? error.message : '신분증 단계 저장 실패',
      ownerId: uid,
      snapshot: { function: 'saveIdDocument' },
    });
    throw error;
  }
}

/**
 * [Step 3] 얼굴 인증 이미지 파일 저장
 */
export async function saveFaceVerification(
  uid: string,
  faceImages: { direction: string; file: File }[],
): Promise<void> {
  try {
    // TODO: Production 환경에서 실제 인증 API 호출
    // 현재는 테스트 모드로 파일 저장만 수행

    // 얼굴 이미지 업로드
    const uploadPromises = faceImages.map(async (img) => {
      let fileType = 'face_front';
      
      switch (img.direction) {
        case 'front':
          fileType = 'face_front';
          break;
        case 'up':
          fileType = 'face_up';
          break;
        case 'down':
          fileType = 'face_down';
          break;
        case 'left':
          fileType = 'face_left';
          break;
        case 'right':
          fileType = 'face_right';
          break;
        default:
          fileType = 'face_front';
      }
      
      return uploadFile(uid, fileType, img.file);
    });

    await Promise.all(uploadPromises);

    // KYC 단계 3 완료 처리
    const result = await completeKYCStep(uid, 3);
    console.log('Face verification completed:', result.testModeMessage);
  } catch (error) {
    console.error("Error saving face verification:", error);
    logAdminSystemEvent({
      severity: 'error',
      category: 'kyc',
      message: error instanceof Error ? error.message : '얼굴 인증 단계 저장 실패',
      ownerId: uid,
      snapshot: { function: 'saveFaceVerification' },
    });
    throw error;
  }
}

/**
 * KYC 인증 프로세스 최종 완료 처리
 * - 임대인 권한은 `completeKYCStep(3)`의 PATCH(`role: owner`) + 캐시 병합으로 이미 반영됨
 * - 레거시·호환용으로 남김 (중복 PATCH 방지)
 */
export async function completeKYCVerification(uid: string): Promise<void> {
  try {
    const res = await fetch(
      `/api/app/users/${encodeURIComponent(uid)}`,
      withAppActor({
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'owner' }),
      }),
    );
    if (res.ok) {
      const updated = parseAppUserPayload(await res.json());
      if (updated) mergeAuthenticatedUserIntoCache(updated);
      return;
    }
  } catch (error) {
    console.error('Error completing KYC verification:', error);
    logAdminSystemEvent({
      severity: 'warning',
      category: 'kyc',
      message: error instanceof Error ? error.message : 'KYC 완료 후 역할 갱신 실패',
      ownerId: uid,
      snapshot: { function: 'completeKYCVerification' },
    });
  }
}

/**
 * 사용자의 인증 상태 가져오기
 * 테스트 모드: 항상 'none' 반환 (실제 인증 상태는 userData?.role로 확인)
 */
export async function getVerificationStatus(
  uid: string,
): Promise<string> {
  try {
    const response = await fetch(`/api/app/users/${encodeURIComponent(uid)}`, {
      cache: 'no-store',
    });
    if (!response.ok) return 'none';
    const user = parseAppUserPayload(await response.json());
    return user?.verification_status || 'none';
  } catch (error) {
    console.error("Error getting verification status:", error);
    return 'none';
  }
}
