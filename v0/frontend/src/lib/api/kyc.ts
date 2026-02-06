/**
 * KYC (Know Your Customer) 인증 API (테스트 데이터 저장 모드)
 * * 임대인 인증을 위한 데이터 저장 로직
 * 이미지 파일은 서버의 public/uploads/verification/[userId] 폴더에 저장됩니다.
 */

import {
  PhoneVerificationData,
  IdDocumentData,
  FaceVerificationData,
} from "@/types/kyc.types";
import { useAuth } from "@/hooks/useAuth";

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
  idData?: any
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
  
  // LocalStorage에 kyc_steps 업데이트
  try {
    const { updateUserData } = await import('./auth');
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const userIndex = users.findIndex((u: any) => u.uid === userId);
    
    if (userIndex !== -1) {
      const user = users[userIndex];
      const kyc_steps = user.kyc_steps || {};
      
      // 단계별 업데이트
      if (step === 1) kyc_steps.step1 = true;
      if (step === 2) kyc_steps.step2 = true;
      if (step === 3) kyc_steps.step3 = true;
      
      user.kyc_steps = kyc_steps;
      user.updatedAt = new Date().toISOString();
      users[userIndex] = user;
      localStorage.setItem('users', JSON.stringify(users));
    }
  } catch (error) {
    console.log('LocalStorage update failed, continuing anyway:', error);
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
    const frontImagePath = await uploadFile(uid, 'id_front', frontImageFile);
    
    // 신분증 뒷면 업로드 (있는 경우)
    let backImagePath: string | undefined;
    if (backImageFile) {
      backImagePath = await uploadFile(uid, 'id_back', backImageFile);
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
    throw error;
  }
}

/**
 * KYC 인증 프로세스 최종 완료 처리
 * - User 테이블의 role을 'owner'로 업데이트
 * - 임대인 권한 부여
 */
export async function completeKYCVerification(uid: string): Promise<void> {
  try {
    // User 테이블의 role을 'owner'로 업데이트
    const response = await fetch('/api/auth/update-role', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId: uid, role: 'owner' }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update user role');
    }

    console.log('KYC verification process completed for user:', uid);
    console.log('User role updated to "owner"');
  } catch (error) {
    console.error("Error completing KYC verification:", error);
    // 테스트 모드: 에러가 발생해도 계속 진행
    console.log('Test mode: Continuing despite role update error');
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
    // 테스트 모드: 항상 'none' 반환
    // 실제 구현에서는 DB에서 verificationStatus 조회 필요
    return 'none';
  } catch (error) {
    console.error("Error getting verification status:", error);
    return 'none';
  }
}
