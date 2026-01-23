/**
 * KYC (Know Your Customer) 인증 API (LocalStorage 버전)
 * 
 * 임대인 인증을 위한 전화번호 인증, 신분증 촬영, 얼굴 인증 등
 * Firebase가 정지된 상태에서 UI/로직 테스트를 위한 임시 구현
 */

import { 
  VerificationStatus, 
  PhoneVerificationData, 
  IdDocumentData, 
  FaceVerificationData,
  PrivateData,
  IdType 
} from '@/types/kyc.types';
import { getUsers, saveUsers, getCurrentUserId } from './auth';

/**
 * 이미지를 base64로 변환
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Firebase Storage에 이미지 업로드 (LocalStorage 버전 - base64로 저장)
 */
export async function uploadKYCImage(
  uid: string,
  file: File,
  filename: string
): Promise<string> {
  try {
    // base64로 변환하여 반환
    const base64 = await fileToBase64(file);
    return base64;
  } catch (error) {
    console.error('Error uploading KYC image:', error);
    throw error;
  }
}

/**
 * 전화번호 인증 완료 후 데이터 저장
 * Step 1 완료 토큰 발급
 */
export async function savePhoneVerification(
  uid: string,
  data: PhoneVerificationData
): Promise<void> {
  try {
    const users = getUsers();
    const userIndex = users.findIndex(u => u.uid === uid);
    
    if (userIndex === -1) {
      throw new Error('User not found');
    }

    users[userIndex] = {
      ...users[userIndex],
      phoneNumber: data.phoneNumber,
      kyc_steps: {
        ...users[userIndex].kyc_steps,
        step1: true, // Step 1 완료 토큰
      },
      updatedAt: new Date().toISOString(),
    };

    saveUsers(users);
  } catch (error) {
    console.error('Error saving phone verification:', error);
    throw error;
  }
}

/**
 * 신분증 정보 및 이미지 저장 (앞면/뒷면)
 */
export async function saveIdDocument(
  uid: string,
  idData: IdDocumentData,
  frontImageFile: File,
  backImageFile?: File
): Promise<void> {
  try {
    // 1. 앞면 이미지를 base64로 변환
    const frontImageUrl = await fileToBase64(frontImageFile);

    // 2. 뒷면 이미지를 base64로 변환 (있는 경우)
    let backImageUrl: string | undefined;
    if (backImageFile) {
      backImageUrl = await fileToBase64(backImageFile);
    }

    // 3. 사용자 데이터 업데이트
    const users = getUsers();
    const userIndex = users.findIndex(u => u.uid === uid);
    
    if (userIndex === -1) {
      throw new Error('User not found');
    }

    // 민감 정보를 private_data 필드에 저장
    const privateData: PrivateData = {
      fullName: idData.fullName,
      idNumber: idData.idNumber,
      dateOfBirth: idData.dateOfBirth,
      phoneNumber: users[userIndex].phoneNumber || '',
      idType: idData.type,
      ...(idData.issueDate && { issueDate: idData.issueDate }),
      ...(idData.expiryDate && { expiryDate: idData.expiryDate }),
      idDocumentFrontImage: frontImageUrl,
      ...(backImageUrl && { idDocumentBackImage: backImageUrl }),
    };

    users[userIndex] = {
      ...users[userIndex],
      private_data: privateData,
      kyc_steps: {
        ...users[userIndex].kyc_steps,
        step2: true, // Step 2 완료 토큰
      },
      updatedAt: new Date().toISOString(),
    };

    saveUsers(users);
  } catch (error) {
    console.error('Error saving ID document:', error);
    throw error;
  }
}

/**
 * 얼굴 인증 이미지 저장 (여러 방향)
 */
export async function saveFaceVerification(
  uid: string,
  images: { direction: string; file: File }[]
): Promise<string[]> {
  try {
    const imageUrls: string[] = [];

    // 1. 각 방향별 이미지를 base64로 변환
    for (const img of images) {
      const imageUrl = await fileToBase64(img.file);
      imageUrls.push(imageUrl);
    }

    // 2. 사용자 데이터 업데이트
    const users = getUsers();
    const userIndex = users.findIndex(u => u.uid === uid);
    
    if (userIndex === -1) {
      throw new Error('User not found');
    }

    users[userIndex] = {
      ...users[userIndex],
      private_data: {
        ...(users[userIndex].private_data as PrivateData),
        faceImageUrl: imageUrls[0], // 정면 이미지를 기본 이미지로
        faceImages: images.map((img, index) => ({
          direction: img.direction,
          imageUrl: imageUrls[index],
        })),
      },
      kyc_steps: {
        ...users[userIndex].kyc_steps,
        step3: true, // Step 3 완료 토큰
      },
      updatedAt: new Date().toISOString(),
    };

    saveUsers(users);

    return imageUrls;
  } catch (error) {
    console.error('Error saving face verification:', error);
    throw error;
  }
}

/**
 * KYC 인증 프로세스 완료 (모든 단계 완료 후)
 * 3단계 모두 완료 시 verification_status를 'verified'로, is_owner를 true로 설정
 */
export async function completeKYCVerification(uid: string): Promise<void> {
  try {
    const users = getUsers();
    const userIndex = users.findIndex(u => u.uid === uid);
    
    if (userIndex === -1) {
      throw new Error('User not found');
    }

    const kycSteps = users[userIndex].kyc_steps || {};
    
    // 3단계 모두 완료되었는지 확인
    const allStepsCompleted = kycSteps.step1 && kycSteps.step2 && kycSteps.step3;
    
    if (allStepsCompleted) {
      users[userIndex] = {
        ...users[userIndex],
        verification_status: 'verified' as VerificationStatus,
        is_owner: true, // 임대인 인증 완료
        updatedAt: new Date().toISOString(),
      };
    } else {
      // 아직 모든 단계가 완료되지 않았으면 pending 상태로
      users[userIndex] = {
        ...users[userIndex],
        verification_status: 'pending' as VerificationStatus,
        updatedAt: new Date().toISOString(),
      };
    }

    saveUsers(users);
  } catch (error) {
    console.error('Error completing KYC verification:', error);
    throw error;
  }
}

/**
 * 사용자의 인증 상태 가져오기
 */
export async function getVerificationStatus(uid: string): Promise<VerificationStatus> {
  try {
    const users = getUsers();
    const user = users.find(u => u.uid === uid);
    
    if (user) {
      return (user.verification_status as VerificationStatus) || 'none';
    }
    
    return 'none';
  } catch (error) {
    console.error('Error getting verification status:', error);
    return 'none';
  }
}
